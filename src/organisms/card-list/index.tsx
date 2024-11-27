import React from 'react';

import InfoCard, { infoCardProps } from '../../molecules/infocard';

export type CardListProps = {
  cards: Array<infoCardProps>;
  isLoading?: boolean;
};

export default function CardList(porps: CardListProps) {
  // Fixed typo CardListPorps->CardListProps
  let listCards = porps.cards;
  if (porps.isLoading) {
    // create 4 cards data
    listCards = Array.from({ length: 4 }, (_, i) => ({
      title: `Loading ${i}`,
      description: `Loading ${i}`,
      content: `Loading ${i}`,
      footer: `Loading ${i}`,
    }));
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 max-h-full">
      {listCards.map((card: infoCardProps) => (
        <InfoCard
          loading={porps.isLoading}
          key={card.title.replace(' ', '_')}
          {...card}
        />
      ))}
    </div>
  );
}
