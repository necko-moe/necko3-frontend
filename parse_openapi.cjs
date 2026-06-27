const fs = require('fs');
const path = require('path');

const openapiPath = 'c:/Users/necko/Desktop/necko3-frontend/openapi.json';
const openapi = JSON.parse(fs.readFileSync(openapiPath, 'utf8'));

let out = '';
out += '--- Swagger API Summary ---\n';
out += `Title: ${openapi.info?.title}\n`;
out += `Version: ${openapi.info?.version}\n`;

out += '\n--- Paths ---\n';
const paths = openapi.paths || {};
for (const [route, methods] of Object.entries(paths)) {
  for (const [method, spec] of Object.entries(methods)) {
    out += `${method.toUpperCase()} ${route} (operationId: ${spec.operationId}) - ${spec.summary || spec.description || 'No description'}\n`;
    if (spec.parameters && spec.parameters.length > 0) {
      out += '  Parameters:\n';
      spec.parameters.forEach(p => {
        out += `    - ${p.name} (${p.in}): ${p.required ? 'required' : 'optional'} - ${p.schema?.type || 'unknown'}\n`;
      });
    }
    if (spec.requestBody) {
      out += '  RequestBody schemas:\n';
      const contentTypes = Object.keys(spec.requestBody.content || {});
      contentTypes.forEach(ct => {
        const schema = spec.requestBody.content[ct].schema;
        out += `    - ${ct}: ${schema?.$ref || schema?.type || 'unknown'}\n`;
      });
    }
    out += '  Responses:\n';
    for (const [statusCode, responseSpec] of Object.entries(spec.responses || {})) {
      out += `    - ${statusCode}: ${responseSpec.description || 'No description'}\n`;
    }
  }
}

out += '\n--- Components Schemas ---\n';
const schemas = openapi.components?.schemas || {};
for (const [name, schemaSpec] of Object.entries(schemas)) {
  out += `- ${name}: type=${schemaSpec.type}, properties=[${Object.keys(schemaSpec.properties || {}).join(', ')}]\n`;
}

fs.writeFileSync('c:/Users/necko/Desktop/necko3-frontend/openapi_summary.txt', out, 'utf8');
console.log('Done!');
