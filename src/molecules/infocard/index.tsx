import React from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export type infoCardProps = {
  content: string;
  description: string;
  footer: string;
  title: string;
};

export default function InfoCard(infoCard: infoCardProps) {
  return (
    <Card>
      <CardHeader className="text-base leading-7 text-gray-600">
        <CardTitle>{infoCard.title}</CardTitle>
        <CardDescription>{infoCard.description}</CardDescription>
      </CardHeader>
      <CardContent className="order-first text-center text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
        {infoCard.content}
      </CardContent>
      <CardFooter className="text-gray-400">
        <p>{infoCard.footer}</p>
      </CardFooter>
    </Card>
  );
}
