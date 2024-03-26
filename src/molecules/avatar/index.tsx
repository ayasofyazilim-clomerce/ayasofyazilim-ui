import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface avatarProps {
  sideText?: string;
  text?: string;
  url?: string;
}

export default function AvatarWrapper({ url, text, sideText }: avatarProps) {
  return (
    <div className="flex justify-center align-center items-center">
      <Avatar>
        <AvatarImage src={url} />
        {text && <AvatarFallback>{text}</AvatarFallback>}
      </Avatar>
      <span className="ml-2"> {sideText} </span>
    </div>
  );
}
