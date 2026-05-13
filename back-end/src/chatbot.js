exports.chatbotHandler = async (event) => {
  const method = event.httpMethod || event.requestContext?.http?.method;
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Content-Type': 'application/json'
  };

  if (method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'OK' })
    };
  }

  if (method !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { message, userId } = body;

    const responses = {
      'olá': 'Olá! Bem-vindo ao assistente virtual da Biblioteca UFERSA. Como posso ajudá-lo hoje?',
      'horário': 'A Biblioteca UFERSA funciona de segunda a sexta-feira, das 7h às 22h.',
      'localização': 'A Biblioteca está localizada no campus principal da UFERSA.',
      'empréstimo': 'Para realizar empréstimos, você precisa ter matrícula ativa e apresentar documento com foto.',
      'reserva': 'Você pode fazer reservas de salas através do sistema SIFU.',
      'default': 'Recebi sua mensagem: "' + (message || '') + '". Em breve nosso sistema de IA estará disponível para atendimento personalizado.'
    };

    const userMessage = (message || '').toLowerCase();
    let responseText = responses.default;

    for (const key in responses) {
      if (userMessage.includes(key)) {
        responseText = responses[key];
        break;
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        response: responseText,
        timestamp: new Date().toISOString(),
        userId: userId || 'anonymous',
        sessionId: event.requestContext?.requestId || 'unknown'
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
};