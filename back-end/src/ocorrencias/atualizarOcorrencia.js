const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const tabela = process.env.OCORRENCIAS_TABLE;

exports.handler = async (event) => {
  try {
    const { id } = event.pathParameters;
    const body = JSON.parse(event.body);
    
    if (!id) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ erro: 'ID da ocorrencia é obrigatório' })
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
        body: JSON.stringify({ erro: 'Ocorrência não encontrada' })
      };
    }
    
    const updates = [];
    const expressionValues = {};
    
    if (body.aluno_nome !== undefined) {
      updates.push('#aluno_nome = :aluno_nome');
      expressionValues[':aluno_nome'] = body.aluno_nome;
    }
    if (body.aluno_matricula !== undefined) {
      updates.push('#aluno_matricula = :aluno_matricula');
      expressionValues[':aluno_matricula'] = body.aluno_matricula;
    }
    if (body.sala_id !== undefined) {
      updates.push('#sala_id = :sala_id');
      expressionValues[':sala_id'] = body.sala_id;
    }
    if (body.descricao !== undefined) {
      updates.push('#descricao = :descricao');
      expressionValues[':descricao'] = body.descricao;
    }
    if (body.funcionario_responsavel !== undefined) {
      updates.push('#funcionario_responsavel = :funcionario_responsavel');
      expressionValues[':funcionario_responsavel'] = body.funcionario_responsavel;
    }
    if (body.foto_url !== undefined) {
      updates.push('#foto_url = :foto_url');
      expressionValues[':foto_url'] = body.foto_url;
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
    console.error('Erro ao atualizar ocorrencia:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ erro: 'Erro ao atualizar ocorrencia' })
    };
  }
};