import React from 'react';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import CardList from '../../organisms/card-list';
import DashboardHeader from '../../organisms/header';

export type DashboardProps = {
  logo: string;
  title: string;
};

const cards = {
  cards: [
    {
      title: 'Paid',
      content: '15%',
      description: 'Number of paid taxes',
      footer: 'Your target is 100%',
    },
    {
      title: 'People',
      content: '15k',
      description: 'Number of people in the system',
      footer: 'Your target is 20K',
    },
    {
      title: 'WIP',
      content: '1',
      description: 'Number of WIP refunds',
      footer: 'Your target is 0',
    },
    {
      title: 'WIP',
      content: '1',
      description: 'Number of WIP refunds',
      footer: 'Your target is 0',
    },
  ],
};

export default function Dashboard() {
  // porps: DashboardProps
  return (
    <>
      <DashboardHeader />
      <div className="flex flex-col items-center justify-start h-screen w-11/12">
        <div className="flex-row p-4">
          <CardList {...cards} />
        </div>
        <div className="w-10/12 flex-row p-4 m-4">
          <Table>
            <TableCaption>A list of your recent invoices.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Invoice</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">INV001</TableCell>
                <TableCell>Paid</TableCell>
                <TableCell>Credit Card</TableCell>
                <TableCell className="text-right">$250.00</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
