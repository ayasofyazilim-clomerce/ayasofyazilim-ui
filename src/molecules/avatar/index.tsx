import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface avatarProps {
  text?: string;
  url?: string;
}

export default function AvatarWrapper({ url, text }: avatarProps) {
  return (
    <Avatar>
      <AvatarImage src={url} />
      {text && <AvatarFallback>{text}</AvatarFallback>}
    </Avatar>
  );
}
