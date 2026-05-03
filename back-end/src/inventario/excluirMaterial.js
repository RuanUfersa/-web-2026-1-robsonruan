const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, DeleteCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const tabela = process.env.INVENTARIO_TABLE;

exports.handler = async (event) => {
  try {
    const { id } = event.pathParameters;
    
    if (!id) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ erro: 'ID do material é obrigatório' })
      };
    }
    
    const existente = await docClient.send(new GetCommand({
      TableName: tabela,
      Key: { id }
    }));
    
    if (!existente.Item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ erro: 'Material não encontrado' })
      };
    }
    
    await docClient.send(new DeleteCommand({
      TableName: tabela,
      Key: { id }
    }));
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensagem: 'Material excluído com sucesso' })
    };
    
  } catch (error) {
    console.error('Erro ao excluir material:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ erro: 'Erro ao excluir material' })
    };
  }
};