const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const config = {
  region: 'localhost'
};
if (process.env.DYNAMODB_ENDPOINT) {
  config.endpoint = process.env.DYNAMODB_ENDPOINT;
  config.credentials = { accessKeyId: 'local', secretAccessKey: 'local' };
}

const client = new DynamoDBClient(config);
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

const tabela = process.env.SALAS_TABLE;

exports.handler = async (event) => {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: tabela
    }));
    
    const salas = result.Items || [];
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(salas)
    };
    
  } catch (error) {
    console.error('Erro ao listar salas:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ erro: 'Erro ao listar salas' })
    };
  }
};