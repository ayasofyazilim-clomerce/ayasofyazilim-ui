import { ErrorObject } from 'ajv';

export function AJV_TR(errors: null | ErrorObject[] = []) {
  if (!(errors && errors.length)) return;
  errors.forEach((error) => {
    let outMessage = '';

    switch (error.keyword) {
      case 'pattern': {
        outMessage = `Bu alan "${error.params.pattern}" formatına uymalıdır.`;
        break;
      }
      case 'required': {
        outMessage = 'Bu alan zorunludur.';
        break;
      }
      case 'format': {
        outMessage = `Bu alan ${error.params.format} formatına uymalıdır.`;
        break;
      }
      case 'minimum': {
        outMessage = `Bu alan ${error.params.limit} değerinden büyük veya eşit olmalıdır.`;
        break;
      }
      case 'maximum': {
        outMessage = `Bu alan ${error.params.limit} değerinden küçük veya eşit olmalıdır.`;
        break;
      }
      case 'minLength': {
        outMessage = `Bu alan ${error.params.limit} haneden küçük olamaz.`;
        break;
      }
      case 'maxLength': {
        outMessage = `Bu alan ${error.params.limit} haneden büyük olamaz.`;
        break;
      }
      case 'minItems': {
        outMessage = `Bu alan ${error.params.limit} öğeden az olamaz.`;
        break;
      }
      case 'maxItems': {
        outMessage = `Bu alan ${error.params.limit} öğeden fazla olamaz.`;
        break;
      }
      case 'uniqueItems': {
        outMessage = `Bu alanda yinelenen öğeler olamaz (öğeler ## ${error.params.j} ve ${error.params.i} aynıdır).`;
        break;
      }
      case 'type': {
        outMessage = `Bu alan ${error.params.type} türünde olmalıdır.`;
        break;
      }
      case 'enum': {
        outMessage = 'Bu alan izin verilen değerlerden biriyle eşit olmalıdır.';
        break;
      }
      case 'dependencies': {
        outMessage = `${error.params.depsCount} özelliği, ${error.params.property} özelliği mevcut olduğunda gerekli olmalıdır.`;
        break;
      }
      case 'additionalProperties': {
        outMessage = 'Ekstra özelliklere sahip olmamalıdır.';
        break;
      }
      case 'additionalItems': {
        outMessage = `Bu alanda ${error.params.limit} öğeden fazla öğe bulunmamalıdır.`;
        break;
      }
      case 'oneOf': {
        outMessage = 'Bu alan "oneOf" içindeki tam bir şemaya uymalıdır.';
        break;
      }
      case 'anyOf': {
        outMessage = 'Bu alan "anyOf" içindeki bir şemaya uymalıdır.';
        break;
      }
      case 'not': {
        outMessage = 'Bu alan "not" içindeki şemaya göre geçerli olmamalıdır.';
        break;
      }
      case 'const': {
        outMessage = 'Bu alan sabit değerle eşit olmalıdır.';
        break;
      }
      case 'contains': {
        outMessage = 'Bu alan geçerli bir öğe içermelidir.';
        break;
      }
      case 'if': {
        outMessage = `"${error.params.failingKeyword}" şemasına uymalıdır.`;
        break;
      }
      case 'discriminator': {
        if (error.params.tag) {
          outMessage = `"${error.params.tag}" etiketi string olmalıdır.`;
        } else if (error.params.mapping) {
          outMessage = `"${error.params.tag}" etiketinin değeri oneOf içinde olmalıdır.`;
        }
        break;
      }
      default:
        outMessage = error.message || '';
    }
     
    error.message = outMessage;
  });
}
