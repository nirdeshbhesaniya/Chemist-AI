const axios = require('axios');

const BASE = process.env.PUBCHEM_BASE_URL || 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';

/**
 * Parse compound properties from PubChem response
 */
const parseCompoundProps = (compound) => {
    const props = {};
    compound.props?.forEach(p => {
        const key = p.urn?.label;
        const name = p.urn?.name;
        const val = p.value?.sval || p.value?.fval || p.value?.ival;
        if (key && val !== undefined) {
            props[`${key}_${name || ''}`] = val;
        }
    });
    return props;
};

/**
 * Get compound by CID
 */
const getCompoundByCID = async (cid) => {
    try {
        const response = await axios.get(
            `${BASE}/compound/cid/${cid}/JSON`,
            { timeout: 10000 }
        );
        const compound = response.data.PC_Compounds?.[0];
        if (!compound) return null;

        const props = parseCompoundProps(compound);

        return {
            cid: compound.id?.id?.cid,
            molecularFormula: props['Molecular Formula_'] || props['Molecular Formula_undefined'],
            molecularWeight: props['Molecular Weight_'] || props['Molecular Weight_undefined'],
            iupacName: props['IUPAC Name_Preferred'] || props['IUPAC Name_CAS-like Style'] || props['IUPAC Name_Traditional'],
            smiles: props['SMILES_Canonical'] || props['SMILES_Isomeric'],
            inchi: props['InChI_Standard'],
            inchiKey: props['InChIKey_Standard'],
            xlogp: props['Log P_XLogP3'],
            tpsa: props['Topological Polar Surface Area_'],
            hbondAcceptor: props['Hydrogen Bond Acceptor Count_'],
            hbondDonor: props['Hydrogen Bond Donor Count_'],
            rotatableBonds: props['Rotatable Bond Count_'],
            heavyAtomCount: props['Heavy Atom Count_'],
            charge: props['Formal Charge_'],
            complexity: props['Complexity_'],
            raw: props
        };
    } catch (error) {
        console.error(`[PubChem] Error fetching CID ${cid}:`, error.message);
        return null;
    }
};

/**
 * Search for compound by name and get first result
 */
const searchCompoundByName = async (name) => {
    try {
        const encoded = encodeURIComponent(name);
        const response = await axios.get(
            `${BASE}/compound/name/${encoded}/cids/JSON?limit=5`,
            { timeout: 10000 }
        );
        const cids = response.data.IdentifierList?.CID;
        return cids && cids.length > 0 ? cids[0] : null;
    } catch (error) {
        console.error(`[PubChem] Search error for "${name}":`, error.message);
        return null;
    }
};

/**
 * Fetch compound data from PubChem by name (with fallback search)
 */
const getCompoundByName = async (name) => {
    try {
        const encoded = encodeURIComponent(name);
        
        // Try exact match first
        try {
            const response = await axios.get(`${BASE}/compound/name/${encoded}/JSON`, { timeout: 10000 });
            const compound = response.data.PC_Compounds?.[0];
            if (compound) {
                const props = parseCompoundProps(compound);
                return {
                    cid: compound.id?.id?.cid,
                    molecularFormula: props['Molecular Formula_'] || props['Molecular Formula_undefined'],
                    molecularWeight: props['Molecular Weight_'] || props['Molecular Weight_undefined'],
                    iupacName: props['IUPAC Name_Preferred'] || props['IUPAC Name_CAS-like Style'] || props['IUPAC Name_Traditional'],
                    smiles: props['SMILES_Canonical'] || props['SMILES_Isomeric'],
                    inchi: props['InChI_Standard'],
                    inchiKey: props['InChIKey_Standard'],
                    xlogp: props['Log P_XLogP3'],
                    tpsa: props['Topological Polar Surface Area_'],
                    hbondAcceptor: props['Hydrogen Bond Acceptor Count_'],
                    hbondDonor: props['Hydrogen Bond Donor Count_'],
                    rotatableBonds: props['Rotatable Bond Count_'],
                    heavyAtomCount: props['Heavy Atom Count_'],
                    charge: props['Formal Charge_'],
                    complexity: props['Complexity_'],
                    raw: props
                };
            }
        } catch (exactError) {
            // If exact match fails (404), try search fallback
            console.log(`[PubChem] Exact match failed for "${name}", trying search...`);
        }

        // Fallback: Search and use first result
        const cid = await searchCompoundByName(name);
        if (cid) {
            console.log(`[PubChem] Found compound via search: CID ${cid}`);
            return await getCompoundByCID(cid);
        }

        console.warn(`[PubChem] Compound not found: "${name}"`);
        return null;
    } catch (error) {
        console.error('[PubChem] Error in getCompoundByName:', error.message);
        return null;
    }
};

/**
 * Fetch compound by SMILES string
 */
const getCompoundBySmiles = async (smiles) => {
    try {
        const encoded = encodeURIComponent(smiles);
        const response = await axios.get(
            `${BASE}/compound/smiles/${encoded}/JSON`,
            { timeout: 10000 }
        );
        const compound = response.data.PC_Compounds?.[0];
        if (!compound) {
            console.warn(`[PubChem] No compound found for SMILES: ${smiles}`);
            return null;
        }

        const props = parseCompoundProps(compound);

        return {
            cid: compound.id?.id?.cid,
            molecularFormula: props['Molecular Formula_'] || props['Molecular Formula_undefined'],
            molecularWeight: props['Molecular Weight_'] || props['Molecular Weight_undefined'],
            iupacName: props['IUPAC Name_Preferred'] || props['IUPAC Name_CAS-like Style'] || props['IUPAC Name_Traditional'],
            smiles,
            inchiKey: props['InChIKey_Standard'],
            xlogp: props['Log P_XLogP3'],
            tpsa: props['Topological Polar Surface Area_'],
            raw: props
        };
    } catch (error) {
        console.error('[PubChem] SMILES lookup error:', error.message);
        return null;
    }
};

/**
 * Get safety data (GHS classifications)
 */
const getSafetyData = async (cid) => {
    try {
        const response = await axios.get(
            `${BASE}/compound/cid/${cid}/JSON?record_type=2d`,
            { timeout: 10000 }
        );
        return response.data;
    } catch {
        return null;
    }
};

/**
 * Search for compound CID by name
 */
const searchCompound = async (query) => {
    try {
        const encoded = encodeURIComponent(query);
        const response = await axios.get(
            `${BASE}/compound/name/${encoded}/cids/JSON`,
            { timeout: 10000 }
        );
        return response.data.IdentifierList?.CID || [];
    } catch {
        return [];
    }
};

module.exports = { 
    getCompoundByName, 
    getCompoundBySmiles, 
    getCompoundByCID,
    getSafetyData, 
    searchCompound, 
    searchCompoundByName 
};
