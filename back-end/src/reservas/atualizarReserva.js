const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const tabela = process.env.RESERVAS_TABLE;

exports.handler = async (event) => {
  try {
    const { id } = event.pathParameters;
    const body = JSON.parse(event.body);
    
    if (!id) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ erro: 'ID da reserva é obrigatório' })
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
        body: JSON.stringify({ erro: 'Reserva não encontrada' })
      };
    }
    
    const updates = [];
    const expressionValues = {};
    
    if (body.nome !== undefined) {
      updates.push('#nome = :nome');
      expressionValues[':nome'] = body.nome;
    }
    if (body.matricula !== undefined) {
      updates.push('#matricula = :matricula');
      expressionValues[':matricula'] = body.matricula;
    }
    if (body.cargo !== undefined) {
      updates.push('#cargo = :cargo');
      expressionValues[':cargo'] = body.cargo;
    }
    if (body.sala_id !== undefined) {
      updates.push('#sala_id = :sala_id');
      expressionValues[':sala_id'] = body.sala_id;
    }
    if (body.data !== undefined) {
      updates.push('#data = :data');
      expressionValues[':data'] = body.data;
    }
    if (body.hora_inicio !== undefined) {
      updates.push('#hora_inicio = :hora_inicio');
      expressionValues[':hora_inicio'] = body.hora_inicio;
    }
    if (body.hora_fim !== undefined) {
      updates.push('#hora_fim = :hora_fim');
      expressionValues[':hora_fim'] = body.hora_fim;
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
    console.error('Erro ao atualizar reserva:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ erro: 'Erro ao atualizar reserva' })
    };
  }
};