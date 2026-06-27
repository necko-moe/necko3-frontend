const fs = require('fs');
const openapi = JSON.parse(fs.readFileSync('c:/Users/necko/Desktop/necko3-frontend/openapi.json', 'utf8'));

const targetSchemas = [
  'ChainConfigSchema',
  'ChainDataSchema',
  'CreateInvoiceReqSchema',
  'InvoiceSchema',
  'PaymentSchema',
  'WebhookSchema',
  'ApiKeyRecordSchema',
  'CreateKeyReqSchema',
  'CreateKeyResSchema',
  'ErrorResponseSchema',
  'ErrorObjectSchema'
];

let out = '';
targetSchemas.forEach(name => {
  const schema = openapi.components?.schemas?.[name];
  if (schema) {
    out += `### ${name}\n`;
    out += `Type: ${schema.type}\n`;
    if (schema.properties) {
      out += 'Properties:\n';
      Object.entries(schema.properties).forEach(([propName, propSpec]) => {
        let typeStr = propSpec.type || 'unknown';
        if (propSpec.$ref) {
          typeStr = propSpec.$ref;
        } else if (propSpec.items) {
          typeStr = `${propSpec.items.$ref || propSpec.items.type}[]`;
        }
        out += `  - **${propName}**: \`${typeStr}\` (Nullable: ${!!propSpec.nullable}, Description: ${propSpec.description || 'none'})\n`;
      });
    }
    if (schema.enum) {
      out += `Enum values: [${schema.enum.join(', ')}]\n`;
    }
    out += '\n';
  } else {
    out += `### ${name} - Not Found\n\n`;
  }
});

fs.writeFileSync('c:/Users/necko/Desktop/necko3-frontend/schema_details.md', out, 'utf8');
console.log('Schemas written to schema_details.md');
