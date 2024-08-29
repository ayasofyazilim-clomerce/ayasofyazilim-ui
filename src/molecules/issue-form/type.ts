export type Tag = {
  Earnings: {
    Amount: number;
    Description: string;
  }[];
  ExportValidation: {
    ExportDate: string;
    ExportLocation: number;
    Id: string;
    StampType: number;
  };
  Id: string;
  Invoices: {
    Currency: {
      Currency: string;
      CurrencySymbol: string;
      Id: string;
    };
    Id: string;
    InvoiceLines: {
      Amount: number;
      Id: string;
      ProductGroup: {
        Description: string;
        Id: string;
      };
      Vat: {
        Amount: number;
        Id: string;
        Rate: number;
        VatBase: number;
      };
    }[];
    Number: string;
    TotalAmount: number;
  }[];
  Invoicing: {
    Id: string;
    InvoicingDate: string;
    InvoicingNumber: string;
    InvoicingStatus: number;
  };
  Merchant: {
    Address: {
      FullText: string;
      Id: string;
    };
    Id: string;
    Name: string;
    ProductGroups: {
      Description: string;
      Id: string;
    }[];
  };
  Refund: {
    Id: string;
    PaidDate: string;
    RefundLocation: {
      ID: string;
      Name: string;
    };
    RefundMethod: number;
    Status: number;
    SubmissionDate: string;
  };
  Summary: {
    ExpireDate: string;
    IssuedDate: string;
    RefundMethod: number;
    Status: number;
    Tag: string;
  };
  Totals: {
    Amount: number;
    Description: string;
  }[];
  Traveller: {
    CountryOfResidence: string;
    CountryOfResidenceCode: number;
    Id: string;
    Name: string;
    Nationality: string;
    NationalityCode: number;
    Surname: string;
    TravelDocumentNumber: string;
  };
  Trip: {
    DepartingAirport: {
      Id: string;
      Name: string;
    };
    DepartureDate: string;
    DestinationAirport: {
      Id: string;
      Name: string;
    };
    FlightNumber: string;
    Id: string;
    VisitingDate: string;
  };
};

export type issueFormProps = {
  tag: Tag;
};

export const InvoicesJsonSchema = {
  type: 'object',
  properties: {
    Currency: {
      type: 'object',
      properties: {
        Currency: { type: 'string' },
        CurrencySymbol: { type: 'string' },
        Id: { type: 'string' },
      },
      required: ['Currency', 'CurrencySymbol', 'Id'],
    },
    Id: { type: 'string' },
    InvoiceLines: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          Amount: { type: 'number' },
          Id: { type: 'string' },
          ProductGroup: {
            type: 'object',
            properties: {
              Description: { type: 'string' },
              Id: { type: 'string' },
            },
            required: ['Description', 'Id'],
          },
          Vat: {
            type: 'object',
            properties: {
              Amount: { type: 'number' },
              Id: { type: 'string' },
              Rate: { type: 'number' },
              VatBase: { type: 'number' },
            },
            required: ['Amount', 'Id', 'Rate', 'VatBase'],
          },
        },
        required: ['Amount', 'Id', 'ProductGroup', 'Vat'],
      },
    },
  },
  required: ['Currency', 'Id', 'InvoiceLines'],
};
