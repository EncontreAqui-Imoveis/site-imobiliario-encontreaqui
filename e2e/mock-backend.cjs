const http = require('http');
const { URL } = require('url');

const port = Number(process.env.MOCK_API_PORT || 4010);

const demoImage = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
const createdAt = '2026-04-07T10:00:00.000Z';
const updatedAt = '2026-04-07T10:00:00.000Z';

const properties = [
  {
    id: 101,
    title: 'Casa E2E',
    description: 'Imóvel usado para validar o fluxo ponta a ponta.',
    type: 'Casa',
    status: 'approved',
    purpose: 'Venda',
    price: 350000,
    price_sale: 350000,
    address: 'Rua Teste',
    city: 'Goiânia',
    state: 'GO',
    bairro: 'Centro',
    cep: '74000000',
    images: [demoImage],
    broker_name: 'Corretor E2E',
    broker_phone: '62999999999',
    created_at: createdAt,
    code: 'E2E-101',
  },
  {
    id: 102,
    title: 'Apartamento Azul',
    description: 'Segundo imóvel da suíte E2E.',
    type: 'Apartamento',
    status: 'approved',
    purpose: 'Venda',
    price: 420000,
    price_sale: 420000,
    address: 'Rua Azul',
    city: 'Goiânia',
    state: 'GO',
    bairro: 'Jardim',
    cep: '74000001',
    images: [demoImage],
    broker_name: 'Corretor E2E',
    broker_phone: '62999999999',
    created_at: createdAt,
    code: 'E2E-102',
  },
];

function json(res, status, payload, origin = 'http://127.0.0.1:3101') {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  });
  res.end(JSON.stringify(payload));
}

function notFound(res, origin) {
  json(res, 404, { error: 'Not found' }, origin);
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk.toString();
    });
    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({});
      }
    });
  });
}

function resolveToken(req) {
  const authHeader = String(req.headers.authorization || '').trim();
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }
  const cookie = String(req.headers.cookie || '');
  const match = cookie.match(/ea_auth_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

function buildClientProfile(token) {
  return {
    role: 'client',
    status: null,
    requiresDocuments: false,
    user: {
      id: 10,
      name: 'Cliente E2E',
      email: 'cliente-e2e@example.com',
      email_verified: true,
      phone: '62999999999',
      street: 'Rua Teste',
      number: '100',
      bairro: 'Centro',
      city: 'Goiânia',
      state: 'GO',
      cep: '74000000',
      createdAt,
      token_hint: token,
    },
  };
}

function buildBrokerProfile(token) {
  return {
    role: 'broker',
    status: 'pending_verification',
    requiresDocuments: true,
    user: {
      id: 20,
      name: 'Corretor E2E',
      email: 'broker-e2e@example.com',
      email_verified: true,
      phone: '62999999998',
      street: 'Rua Broker',
      number: '200',
      bairro: 'Centro',
      city: 'Goiânia',
      state: 'GO',
      cep: '74000000',
      broker_status: 'pending_verification',
      creci: '12345-F',
      createdAt,
      token_hint: token,
    },
  };
}

const server = http.createServer(async (req, res) => {
  const origin = String(req.headers.origin || 'http://127.0.0.1:3101');
  const url = new URL(req.url || '/', `http://127.0.0.1:${port}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    });
    res.end();
    return;
  }

  if (req.method === 'GET' && url.pathname === '/properties') {
    const search = String(url.searchParams.get('search') || '').trim().toLowerCase();
    const filtered = search
      ? properties.filter((item) => item.title.toLowerCase().includes(search))
      : properties;
    json(res, 200, { data: filtered }, origin);
    return;
  }

  if (req.method === 'GET' && url.pathname.startsWith('/public/properties/')) {
    const id = Number(url.pathname.split('/').pop());
    const property = properties.find((item) => item.id === id);
    if (!property) {
      notFound(res, origin);
      return;
    }
    json(res, 200, { data: property }, origin);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/users/me') {
    const token = resolveToken(req);
    if (!token) {
      json(res, 401, { error: 'Unauthorized' }, origin);
      return;
    }
    if (token.includes('broker')) {
      json(res, 200, buildBrokerProfile(token), origin);
      return;
    }
    json(res, 200, buildClientProfile(token), origin);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/properties/me') {
    json(res, 200, [], origin);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/auth/check-email') {
    json(res, 200, { exists: false, hasFirebaseUid: false, hasPassword: false }, origin);
    return;
  }

  if (req.method === 'POST' && url.pathname === '/auth/email-verification/send') {
    json(res, 200, { status: 'ok', delivery: 'sent' }, origin);
    return;
  }

  if (req.method === 'POST' && url.pathname === '/auth/email-verification/verify-code') {
    json(res, 200, { status: 'ok', verified: true, verified_at: createdAt }, origin);
    return;
  }

  if (req.method === 'POST' && url.pathname === '/auth/otp/request') {
    json(res, 200, { sessionToken: 'otp-session-e2e', expiresAt: '2026-04-08T10:00:00.000Z' }, origin);
    return;
  }

  if (req.method === 'POST' && url.pathname === '/auth/otp/resend') {
    json(res, 200, { sessionToken: 'otp-session-e2e', expiresAt: '2026-04-08T10:00:00.000Z' }, origin);
    return;
  }

  if (req.method === 'POST' && url.pathname === '/auth/otp/verify') {
    json(res, 200, { ok: true }, origin);
    return;
  }

  if (req.method === 'POST' && url.pathname === '/auth/register') {
    const body = await readBody(req);
    if (body.profileType === 'broker') {
      json(
        res,
        201,
        {
          user: {
            id: 20,
            name: body.name || 'Corretor E2E',
            email: body.email || 'broker-e2e@example.com',
            role: 'broker',
            email_verified: true,
            phone: body.phone || '62999999998',
            street: body.street || 'Rua Broker',
            number: body.number || '200',
            bairro: body.bairro || 'Centro',
            city: body.city || 'Goiânia',
            state: body.state || 'GO',
            cep: body.cep || '74000000',
            broker_status: 'pending_verification',
            createdAt,
          },
          broker: {
            id: 20,
            name: body.name || 'Corretor E2E',
            email: body.email || 'broker-e2e@example.com',
            role: 'broker',
            creci: body.creci || '12345-F',
            status: 'pending_verification',
            createdAt,
          },
          token: 'site-broker-token',
          needsCompletion: false,
          requiresDocuments: true,
        },
        origin,
      );
      return;
    }

    json(
      res,
      201,
      {
        user: {
          id: 10,
          name: body.name || 'Cliente E2E',
          email: body.email || 'cliente-e2e@example.com',
          role: 'client',
          email_verified: true,
          phone: body.phone || '62999999999',
          street: body.street || 'Rua Teste',
          number: body.number || '100',
          bairro: body.bairro || 'Centro',
          city: body.city || 'Goiânia',
          state: body.state || 'GO',
          cep: body.cep || '74000000',
          createdAt,
        },
        token: 'site-client-token',
        needsCompletion: false,
        requiresDocuments: false,
      },
      origin,
    );
    return;
  }

  if (req.method === 'POST' && /^\/negotiations\/[^/]+\/proposals\/signed$/.test(url.pathname)) {
    json(res, 200, { ok: true }, origin);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/negotiations/mine') {
    json(
      res,
      200,
      {
        data: [
          {
            id: 'neg-1',
            propertyId: 101,
            propertyTitle: 'Casa E2E',
            status: 'PROPOSAL_SIGNED',
            clientName: 'Cliente E2E',
            createdAt,
            updatedAt,
            proposalValidUntil: '2026-04-17T10:00:00.000Z',
          },
        ],
      },
      origin,
    );
    return;
  }

  notFound(res, origin);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`[site mock backend] listening on ${port}`);
});
