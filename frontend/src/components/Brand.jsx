import React from 'react';

export default function Brand({ compact = false }) {
  return (
    <span className={`brand ${compact ? 'brand-compact' : ''}`} translate="no">
      <img src="/minerva-mark.png" alt="" width="64" height="64" />
      <span className="brand-wordmark">Minerva<span className="brand-caption">Seu espaço de preparação</span></span>
    </span>
  );
}
