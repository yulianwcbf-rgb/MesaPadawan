import React from 'react';

export default function MemberAvatar({ member, size = 36 }) {
  if (member?.photo_url) {
    return (
      <img
        src={member.photo_url}
        alt={member?.name || ''}
        className="rounded-full object-cover flex-shrink-0 bg-[#163524]"
        style={{ width: size, height: size }}
      />
    );
  }
  const initial = (member?.name || '?').charAt(0).toUpperCase();
  return (
    <div
      className="rounded-full bg-[#163524] border border-[#224030] flex items-center justify-center flex-shrink-0 font-mono font-semibold text-[#A8E063]"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initial}
    </div>
  );
}