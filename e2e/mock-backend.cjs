const http = require('http');
const { URL } = require('url');

const port = Number(process.env.MOCK_API_PORT || 4010);

const demoImage = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
const createdAt = '2026-04-07T10:00:00.000Z';
const updatedAt = '2026-04-07T10:00:00.000Z';

const properties = Array.from({ length: 25 }, (_, index) => {
  const id = 101 + index;
  const inGoiania = index < 20;
  const bairro = index % 2 === 0 ? 'Centro' : 'Jardim';
  return {
    id,
    title: `Imóvel E2E ${id}`,
    description: 'Imóvel usado para validar o fluxo ponta a ponta.',
    type: index % 3 === 0 ? 'Casa' : 'Apartamento',
    status: 'approved',
    purpose: index % 2 === 0 ? 'Venda' : 'Aluguel',
    price: 300000 + index * 5000,
    price_sale: 300000 + index * 5000,
    address: `Rua Teste ${id}`,
    city: inGoiania ? 'Goiânia' : 'Aparecida de Goiânia',
    state: 'GO',
    bairro: inGoiania ? bairro : 'Buriti Sereno',
    cep: `74000${String(index).padStart(3, '0')}`,
    images: [demoImage],
    broker_name: 'Corretor E2E',
    broker_phone: '62999999999',
    created_at: createdAt,
    code: `E2E-${id}`,
  };
});

const draftStore = new Map();
const draftState = { seq: 0 };

function randomDraftId() {
    draftState.seq += 1
    return `draft-${Date.now()}-${draftState.seq}`
}

function randomDraftToken() {
    return `draft-token-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
}

function parseDraftId(pathname) {
    const prefix = '/auth/register/draft/';
    const relative = pathname.slice(prefix.length);
    return decodeURIComponent(relative.split('/')[0]);
}

function draftFromBody(body = {}) {
    return {
        draftId: body.draftId || body.id,
        profileType: body.profileType || 'client',
        email: String(body.email || ''),
        name: String(body.name || ''),
        phone: body.phone || null,
        street: body.street || null,
        number: body.number || null,
        complement: body.complement || null,
        bairro: body.bairro || null,
        city: body.city || null,
        state: body.state || null,
        cep: body.cep || null,
        withoutNumber: Boolean(body.withoutNumber),
        creci: body.creci || null,
        needsEmailVerification: true,
        needsPhoneVerification: Boolean(body.phone),
        currentStep: body.currentStep || 'IDENTITY',
        status: 'DRAFT',
    }
}

function getDraftRecord(draftId, draftToken) {
    const record = draftStore.get(draftId)
    if (!record || record.draftToken !== draftToken) {
        return null
    }
    return record
}

function draftError(message = 'Draft inválido') {
    return { error: message }
}

function json(res, status, payload, origin = 'http://127.0.0.1:3101') {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-draft-token',
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-draft-token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    });
    res.end();
    return;
  }

  if (req.method === 'GET' && url.pathname === '/properties') {
    const search = String(url.searchParams.get('search') || '').trim().toLowerCase();
    const city = String(url.searchParams.get('city') || '').trim().toLowerCase();
    const bairro = String(url.searchParams.get('bairro') || '').trim().toLowerCase();
    const page = Math.max(Number(url.searchParams.get('page') || 1), 1);
    const limit = Math.max(Number(url.searchParams.get('limit') || 10), 1);
    const status = String(url.searchParams.get('status') || '').trim().toLowerCase();
    const purpose = String(url.searchParams.get('purpose') || '').trim().toLowerCase();
    const filtered = properties.filter((item) => {
      if (search && !item.title.toLowerCase().includes(search)) return false;
      if (city && item.city.toLowerCase() !== city) return false;
      if (bairro && item.bairro.toLowerCase() !== bairro) return false;
      if (status && item.status.toLowerCase() !== status) return false;
      if (purpose && item.purpose.toLowerCase() !== purpose) return false;
      return true;
    });
    const start = (page - 1) * limit;
    const pageItems = filtered.slice(start, start + limit);
    const total = filtered.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    json(res, 200, { properties: pageItems, data: pageItems, total, page, totalPages }, origin);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/properties/featured') {
    const scope = String(url.searchParams.get('scope') || 'sale').trim().toLowerCase();
    const purpose = scope === 'rent' ? 'Aluguel' : 'Venda';
    const limit = Math.max(Number(url.searchParams.get('limit') || 6), 1);
    const rows = properties.filter((item) => item.purpose === purpose).slice(0, limit);
    json(res, 200, { properties: rows, data: rows }, origin);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/properties/cities-with-count') {
    const buckets = new Map();
    for (const item of properties) {
      if (item.status !== 'approved') continue;
      buckets.set(item.city, (buckets.get(item.city) || 0) + 1);
    }
    const rows = [...buckets.entries()]
      .sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'))
      .map(([cityName, total]) => ({ city: cityName, total }));
    json(res, 200, rows, origin);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/properties/bairros') {
    const city = String(url.searchParams.get('city') || '').trim().toLowerCase();
    const buckets = new Map();
    for (const item of properties) {
      if (item.status !== 'approved') continue;
      if (city && item.city.toLowerCase() !== city) continue;
      const key = `${item.city}|||${item.bairro}`;
      buckets.set(key, (buckets.get(key) || 0) + 1);
    }
    const rows = [...buckets.entries()]
      .map(([key, total]) => {
        const [cityName, bairroName] = key.split('|||');
        return { city: cityName, bairro: bairroName, total };
      })
      .sort((a, b) => a.bairro.localeCompare(b.bairro, 'pt-BR'));
    json(res, 200, rows, origin);
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

  if (req.method === 'POST' && url.pathname === '/auth/register/draft') {
    const body = await readBody(req);
    const draftId = randomDraftId();
    const draftToken = randomDraftToken();
    const draft = draftFromBody(body);
    draftStore.set(draftId, {
      draftId,
      draftToken,
      draft: {
        ...draft,
        draftId,
        needsEmailVerification: true,
        needsPhoneVerification: false,
      },
    });
    json(
      res,
      201,
      {
        draftId,
        draftToken,
        draft: {
          ...draft,
          draftId,
          needsEmailVerification: true,
          needsPhoneVerification: false,
        },
        expiresAtMinutes: 20,
      },
      origin,
    );
    return;
  }

  if (req.method === 'GET' && /^\/auth\/register\/draft\/[^/]+$/.test(url.pathname)) {
    const draftId = parseDraftId(url.pathname);
    const draftToken = String(req.headers['x-draft-token'] || '');
    const record = getDraftRecord(draftId, draftToken);
    if (!record) {
      json(res, 404, draftError('Draft não encontrado'), origin);
      return;
    }
    json(res, 200, { draft: { ...record.draft } }, origin);
    return;
  }

  if (req.method === 'PATCH' && /^\/auth\/register\/draft\/[^/]+$/.test(url.pathname)) {
    const draftId = parseDraftId(url.pathname);
    const draftToken = String(req.headers['x-draft-token'] || '');
    const record = getDraftRecord(draftId, draftToken);
    if (!record) {
      json(res, 401, draftError('Token inválido'), origin);
      return;
    }
    const body = await readBody(req);
    record.draft = {
      ...record.draft,
      ...body,
      draftId,
    };
    draftStore.set(draftId, record);
    json(res, 200, { draft: { ...record.draft } }, origin);
    return;
  }

  if (req.method === 'POST' && /^\/auth\/register\/draft\/[^/]+\/verify-email$/.test(url.pathname)) {
    const draftId = parseDraftId(url.pathname);
    const draftToken = String(req.headers['x-draft-token'] || '');
    const record = getDraftRecord(draftId, draftToken);
    if (!record) {
      json(res, 401, draftError('Token inválido'), origin);
      return;
    }
    record.draft.needsEmailVerification = false;
    json(
      res,
      200,
      {
        status: 'ok',
        expiresAt: '2026-04-08T10:00:00.000Z',
        cooldownSec: 0,
        dailyRemaining: 5,
      },
      origin,
    );
    return;
  }

  if (req.method === 'POST' && /^\/auth\/register\/draft\/[^/]+\/verify-email\/confirm$/.test(url.pathname)) {
    const draftId = parseDraftId(url.pathname);
    const draftToken = String(req.headers['x-draft-token'] || '');
    const record = getDraftRecord(draftId, draftToken);
    if (!record) {
      json(res, 401, draftError('Token inválido'), origin);
      return;
    }
    record.draft.needsEmailVerification = false;
    json(res, 200, { ok: true }, origin);
    return;
  }

  if (req.method === 'POST' && /^\/auth\/register\/draft\/[^/]+\/verify-phone$/.test(url.pathname)) {
    const draftId = parseDraftId(url.pathname);
    const draftToken = String(req.headers['x-draft-token'] || '');
    const record = getDraftRecord(draftId, draftToken);
    if (!record) {
      json(res, 401, draftError('Token inválido'), origin);
      return;
    }
    json(
      res,
      200,
      {
        sessionToken: 'draft-otp-session',
        expiresAt: '2026-04-08T10:00:00.000Z',
      },
      origin,
    );
    return;
  }

  if (req.method === 'POST' && /^\/auth\/register\/draft\/[^/]+\/verify-phone\/confirm$/.test(url.pathname)) {
    const draftId = parseDraftId(url.pathname);
    const draftToken = String(req.headers['x-draft-token'] || '');
    const record = getDraftRecord(draftId, draftToken);
    if (!record) {
      json(res, 401, draftError('Token inválido'), origin);
      return;
    }
    record.draft.needsPhoneVerification = false;
    json(res, 200, { ok: true }, origin);
    return;
  }

  if (req.method === 'POST' && /^\/auth\/register\/draft\/[^/]+\/submit-documents$/.test(url.pathname)) {
    const draftId = parseDraftId(url.pathname);
    const draftToken = String(req.headers['x-draft-token'] || '');
    const record = getDraftRecord(draftId, draftToken);
    if (!record) {
      json(res, 401, draftError('Token inválido'), origin);
      return;
    }
    json(res, 200, { ok: true }, origin);
    return;
  }

  if (req.method === 'POST' && /^\/auth\/register\/draft\/[^/]+\/finalize$/.test(url.pathname)) {
    const draftId = parseDraftId(url.pathname);
    const draftToken = String(req.headers['x-draft-token'] || '');
    const record = getDraftRecord(draftId, draftToken);
    if (!record) {
      json(res, 401, draftError('Token inválido'), origin);
      return;
    }
    const body = await readBody(req);
    const isBroker = String(record.draft.profileType || '') === 'broker';
    const rawAction = String(body.action || '');
    const action = (
      rawAction === 'broker_send_later' || rawAction === 'send_later'
        ? 'send_later'
        : rawAction === 'broker_submit_documents' || rawAction === 'client_finalize' || rawAction === 'submit_documents'
          ? 'submit_documents'
          : rawAction
    );
    const requiresDocuments = isBroker && action === 'submit_documents';
    const requiresBrokerAgreement = isBroker && action === 'submit_documents';
    const acceptedTerms = body.acceptedTerms === true
    const acceptedPrivacyPolicy = body.acceptedPrivacyPolicy === true
    const acceptedBrokerAgreement = body.acceptedBrokerAgreement === true
    const termsVersion = String(body.termsVersion || '')
    const privacyPolicyVersion = String(body.privacyPolicyVersion || '')
    const brokerAgreementVersion = String(body.brokerAgreementVersion || '')

    if (!acceptedTerms || !acceptedPrivacyPolicy) {
      json(res, 422, { error: 'Termos e Política obrigatórios', code: 'TERMS_PRIVACY_NOT_ACCEPTED' }, origin);
      return;
    }

    if (requiresBrokerAgreement) {
      if (!acceptedBrokerAgreement || !brokerAgreementVersion) {
        json(res, 422, { error: 'Termo de adesão obrigatório', code: 'BROKER_AGREEMENT_NOT_ACCEPTED' }, origin);
        return;
      }
    }

    if (action === 'submit_documents') {
      if (!termsVersion || !privacyPolicyVersion) {
        json(res, 422, { error: 'Versões dos documentos obrigatórias', code: 'LEGAL_VERSIONS_MISSING' }, origin);
        return;
      }
    }

    if (action === 'submit_documents' && (!termsVersion || !privacyPolicyVersion || (requiresBrokerAgreement && !brokerAgreementVersion))) {
      json(res, 422, { error: 'Versões dos documentos obrigatórias', code: 'LEGAL_VERSIONS_MISSING' }, origin);
      return;
    }
    json(
      res,
      200,
      {
        token: isBroker ? 'site-broker-token' : 'site-client-token',
        user: {
          id: isBroker ? 20 : 10,
          name: String(record.draft.name || (isBroker ? 'Corretor E2E' : 'Cliente E2E')),
          email: String(record.draft.email || (isBroker ? 'broker-e2e@example.com' : 'cliente-e2e@example.com')),
          role: isBroker ? 'broker' : 'client',
          email_verified: !record.draft.needsEmailVerification,
          phone: String(record.draft.phone || '62999999999'),
          street: String(record.draft.street || 'Rua Teste'),
          number: String(record.draft.number || '100'),
          bairro: String(record.draft.bairro || 'Centro'),
          city: String(record.draft.city || 'Goiânia'),
          state: String(record.draft.state || 'GO'),
          cep: String(record.draft.cep || '74000000'),
          creci: record.draft.creci || (isBroker ? '12345-F' : ''),
          token_hint: isBroker ? 'site-broker-token' : 'site-client-token',
        },
        needsCompletion: false,
        requiresDocuments,
      },
      origin,
    );
    return;
  }

  if (req.method === 'POST' && /^\/auth\/register\/draft\/[^/]+\/discard$/.test(url.pathname)) {
    const draftId = parseDraftId(url.pathname);
    const draftToken = String(req.headers['x-draft-token'] || '');
    const record = getDraftRecord(draftId, draftToken);
    if (!record) {
      json(res, 404, draftError('Draft não encontrado'), origin);
      return;
    }
    draftStore.delete(draftId);
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
            status: 'PROPOSAL_SENT',
            clientName: 'Cliente E2E',
            createdAt,
            updatedAt,
            proposalValidUntil: '2026-04-17T10:00:00.000Z',
            capabilities: {
              canRead: true,
              canEditProposal: true,
              canDeleteProposal: true,
              canDownloadDraft: true,
              canUploadSignedProposal: true,
              canOpenContract: false,
            },
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
