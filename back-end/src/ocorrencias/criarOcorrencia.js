const { v4: uuidv4 } = require('uuid');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const tabela = process.env.OCORRENCIAS_TABLE;

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    
    const { aluno_nome, aluno_matricula, sala_id, descricao, funcionario_responsavel, foto_url } = body;
    
    if (!aluno_nome || !aluno_matricula || !descricao) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ erro: 'Campos obrigatórios: aluno_nome, aluno_matricula, descricao' })
      };
    }
    
    const id = uuidv4();
    
    const ocorrencia = {
      id,
      aluno_nome,
      aluno_matricula,
      sala_id: sala_id || null,
      descricao,
      funcionario_responsavel: funcionario_responsavel || null,
      foto_url: foto_url || null,
      status: 'em_analise',
      data_criacao: new Date().toISOString()
    };
    
    await docClient.send(new PutCommand({
      TableName: tabela,
      Item: ocorrencia
    }));
    
    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ocorrencia)
    };
    
  } catch (error) {
    console.error('Erro ao criar ocorrencia:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ erro: 'Erro ao criar ocorrencia' })
    };
  }
};