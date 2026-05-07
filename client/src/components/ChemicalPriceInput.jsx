import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

export default function ChemicalPriceInput({ value, onChange }) {
    const [prices, setPrices] = useState(value || [{ name: '', price: '' }]);

    const handleAdd = () => {
        const newPrices = [...prices, { name: '', price: '' }];
        setPrices(newPrices);
        onChange(newPrices);
    };

    const handleRemove = (index) => {
        const newPrices = prices.filter((_, i) => i !== index);
        setPrices(newPrices);
        onChange(newPrices);
    };

    const handleChange = (index, field, val) => {
        const newPrices = [...prices];
        newPrices[index][field] = val;
        setPrices(newPrices);
        onChange(newPrices);
    };

    return (
        <div>
            {prices.map((item, index) => (
                <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                    <input
                        className="form-input"
                        placeholder="Chemical Name"
                        value={item.name}
                        onChange={(e) => handleChange(index, 'name', e.target.value)}
                    />
                    <input
                        type="number"
                        className="form-input"
                        placeholder="Price ($/kg)"
                        value={item.price}
                        onChange={(e) => handleChange(index, 'price', e.target.value)}
                        style={{ width: '120px' }}
                    />
                    <button type="button" className="btn btn-danger" onClick={() => handleRemove(index)} style={{ padding: '0.5rem' }}>
                        <Trash2 size={16} />
                    </button>
                </div>
            ))}
            <button type="button" className="btn btn-secondary" onClick={handleAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={16} /> Add Chemical
            </button>
        </div>
    );
}
