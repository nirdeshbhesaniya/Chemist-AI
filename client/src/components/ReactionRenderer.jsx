import React from 'react';
import { ArrowRight, Plus } from 'lucide-react';

const formatChemText = (text) => {
    const trimmed = text.trim();
    // Do not sub-script if it looks like a SMILES string
    if (/[=#\[\]\\\/@]/.test(trimmed)) return <span>{trimmed}</span>;
    
    // Split by single letter followed by numbers to appropriately subscript
    return trimmed.split(/([a-zA-Z)]\d+)/g).map((part, i) => {
        const match = part.match(/^([a-zA-Z)])(\d+)$/);
        if (match) {
            return (
                <span key={i}>
                    {match[1]}
                    <sub style={{ fontSize: '0.65em', bottom: '-0.25em', position: 'relative' }}>{match[2]}</sub>
                </span>
            );
        }
        return <span key={i}>{part}</span>;
    });
};

export default function ReactionRenderer({ equation }) {
    if (!equation) return null;
    
    // Split by reaction arrows
    const parts = equation.split(/\s*(?:->|=>|→|==>)\s*/);
    
    if (parts.length < 2) {
        return <div className="reaction-equation" style={{ display: 'inline-block' }}>{formatChemText(equation)}</div>;
    }

    const renderSide = (side) => {
        const items = side.split(/\s*\+\s*/);
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                {items.map((item, i) => {
                    const cleanItem = item.trim();
                    if (!cleanItem) return null;
                    return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ 
                                background: 'var(--bg-input)', 
                                border: '1px solid var(--border-cyan)', 
                                padding: '0.5rem 0.8rem', 
                                borderRadius: 'var(--radius-sm)',
                                fontFamily: 'var(--font-mono)',
                                color: 'var(--cyan)',
                                fontWeight: 600,
                                letterSpacing: '0.05em',
                                boxShadow: '0 2px 8px rgba(0,212,255,0.05)'
                            }}>
                                {formatChemText(cleanItem)}
                            </div>
                            {i < items.length - 1 && <Plus size={16} color="var(--text-muted)" />}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem', 
            flexWrap: 'wrap',
            background: 'var(--bg-card)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            borderLeft: '4px solid var(--cyan)'
        }}>
            {renderSide(parts[0])}
            
            <div style={{ 
                background: 'rgba(0, 212, 255, 0.1)', 
                padding: '0.4rem 1rem', 
                borderRadius: '2rem',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--cyan)'
            }}>
                <ArrowRight size={18} strokeWidth={3} />
            </div>
            
            {renderSide(parts[1])}
        </div>
    );
}
