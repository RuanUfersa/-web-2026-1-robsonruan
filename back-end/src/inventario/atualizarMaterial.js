const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const tabela = process.env.INVENTARIO_TABLE;

exports.handler = async (event) => {
  try {
    const { id } = event.pathParameters;
    const body = JSON.parse(event.body);
    
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
    
    const updates = [];
    const expressionValues = {};
    
    if (body.codigo !== undefined) {
      updates.push('#codigo = :codigo');
      expressionValues[':codigo'] = body.codigo;
    }
    if (body.nome !== undefined) {
      updates.push('#nome = :nome');
      expressionValues[':nome'] = body.nome;
    }
    if (body.tipo !== undefined) {
      updates.push('#tipo = :tipo');
      expressionValues[':tipo'] = body.tipo;
    }
    if (body.sala_id !== undefined) {
      updates.push('#sala_id = :sala_id');
      expressionValues[':sala_id'] = body.sala_id;
    }
    if (body.descricao !== undefined) {
      updates.push('#descricao = :descricao');
      expressionValues[':descricao'] = body.descricao;
    }
    if (body.status !== undefined) {
      updates.push('#status = :status');
      expressionValues[':status'] = body.status;
    }
    
    if (updates.length === 0) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ erro: 'Nenhum campo para atualizar' })
      };
    }
    
    updates.push('#data_atualizacao = :data_atualizacao');
    expressionValues[':data_atualizacao'] = new Date().toISOString();
    
    const result = await docClient.send(new UpdateCommand({
      TableName: tabela,
      Key: { id },
      UpdateExpression: `SET ${updates.join(', ')}`,
      ExpressionAttributeValues: expressionValues,
      ReturnValues: 'ALL_NEW'
    }));
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result.Attributes)
    };
    
  } catch (error) {
    console.error('Erro ao atualizar material:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ erro: 'Erro ao atualizar material' })
    };
  }
};