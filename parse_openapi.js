const fs = require('fs');
const path = require('path');

const openapiPath = 'c:/Users/necko/Desktop/necko3-frontend/openapi.json';
const openapi = JSON.parse(fs.readFileSync(openapiPath, 'utf8'));

console.log('--- Swagger API Summary ---');
console.log('Title:', openapi.info?.title);
console.log('Version:', openapi.info?.version);

console.log('\n--- Paths ---');
const paths = openapi.paths || {};
for (const [route, methods] of Object.entries(paths)) {
  for (const [method, spec] of Object.entries(methods)) {
    console.log(`${method.toUpperCase()} ${route} (operationId: ${spec.operationId}) - ${spec.summary || spec.description || 'No description'}`);
    if (spec.parameters && spec.parameters.length > 0) {
      console.log('  Parameters:');
      spec.parameters.forEach(p => {
        console.log(`    - ${p.name} (${p.in}): ${p.required ? 'required' : 'optional'} - ${p.schema?.type || 'unknown'}`);
      });
    }
    if (spec.requestBody) {
      console.log('  RequestBody schemas:');
      const contentTypes = Object.keys(spec.requestBody.content || {});
      contentTypes.forEach(ct => {
        const schema = spec.requestBody.content[ct].schema;
        console.log(`    - ${ct}: ${schema?.$ref || schema?.type || 'unknown'}`);
      });
    }
    console.log('  Responses:');
    for (const [statusCode, responseSpec] of Object.entries(spec.responses || {})) {
      console.log(`    - ${statusCode}: ${responseSpec.description || 'No description'}`);
    }
  }
}

console.log('\n--- Components Schemas ---');
const schemas = openapi.components?.schemas || {};
for (const [name, schemaSpec] of Object.entries(schemas)) {
  console.log(`- ${name}: type=${schemaSpec.type}, properties=[${Object.keys(schemaSpec.properties || {}).join(', ')}]`);
}
