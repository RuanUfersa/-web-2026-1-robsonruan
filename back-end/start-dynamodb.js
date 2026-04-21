const { spawn } = require('child_process');
const path = require('path');

console.log('Starting DynamoDB Local...');

const dynamoProcess = spawn('java', [
  '-Djava.library.path=./DynamoDBLocal_lib',
  '-jar', 'DynamoDBLocal.jar',
  '-sharedDb',
  '-inMemory'
], {
  cwd: process.cwd(),
  stdio: 'inherit',
  shell: true
});

dynamoProcess.on('error', (err) => {
  console.error('Failed to start DynamoDB:', err.message);
  console.log('\nTrying alternative method...');
});

console.log('DynamoDB should be running on port 8000');
console.log('Run: serverless offline');