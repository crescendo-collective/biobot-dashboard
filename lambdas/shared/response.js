function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    },
    body: JSON.stringify(body),
  };
}

function ok(data) {
  return jsonResponse(200, data);
}

function badRequest(message) {
  return jsonResponse(400, { error: message });
}

function serverError(err) {
  console.error(err);
  return jsonResponse(500, {
    error: 'Internal server error',
    message: process.env.ENVIRONMENT === 'dev' ? err.message : undefined,
  });
}

module.exports = { jsonResponse, ok, badRequest, serverError };
