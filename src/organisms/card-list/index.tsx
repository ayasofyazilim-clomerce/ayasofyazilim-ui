import React from 'react';

import InfoCard, { infoCardProps } from '../../molecules/infocard';

export type CardListPorps = {
  cards: Array<infoCardProps>;
};

export default function CardList(porps: CardListPorps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {porps.cards.map((card: infoCardProps) => (
        <InfoCard key={card.title.replace(' ', '_')} {...card} />
      ))}
    </div>
  );
}
