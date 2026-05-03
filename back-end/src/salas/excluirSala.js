const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, DeleteCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const tabela = process.env.SALAS_TABLE;

exports.handler = async (event) => {
  try {
    const { id } = event.pathParameters;
    
    if (!id) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ erro: 'ID da sala é obrigatório' })
      };
    }
    
    // Verificar se sala existe
    const existente = await docClient.send(new GetCommand({
      TableName: tabela,
      Key: { id }
    }));
    
    if (!existente.Item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ erro: 'Sala não encontrada' })
      };
    }
    
    await docClient.send(new DeleteCommand({
      TableName: tabela,
      Key: { id }
    }));
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensagem: 'Sala excluída com sucesso' })
    };
    
  } catch (error) {
    console.error('Erro ao excluir sala:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ erro: 'Erro ao excluir sala' })
    };
  }
};