const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const tabela = process.env.INVENTARIO_TABLE;

exports.handler = async (event) => {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: tabela
    }));
    
    const materiais = result.Items || [];
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(materiais)
    };
    
  } catch (error) {
    console.error('Erro ao listar materiais:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ erro: 'Erro ao listar materiais' })
    };
  }
};