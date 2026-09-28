import vial from '@/assets/vyrax-vial.jpg';
export const categories = [
  {slug:'metabolic-research', name:'Metabolic research', items:['Retatrutide','Tirzepatide','Semaglutide','AOD-9604','Tesamorelin','5-Amino-1MQ','MOTS-c']},
  {slug:'regenerative-research', name:'Regenerative research', items:['BPC-157','TB-500','GHK-Cu','KPV','LL-37','Wolverine stack']},
  {slug:'gh-secretagogues', name:'GH secretagogues', items:['CJC-1295 DAC','CJC-1295 no-DAC','Ipamorelin','GHRP-2','GHRP-6','IGF-1 LR3']},
  {slug:'longevity-research', name:'Longevity research', items:['NAD+','Epithalon','DSIP','SS-31']},
  {slug:'pigmentation-research', name:'Pigmentation research', items:['Melanotan-2','PT-141']},
  {slug:'peptide-blends', name:'Peptide blends', items:['GLOW','KLOW','Hulk stack']},
  {slug:'lab-supplies', name:'Lab supplies', items:['Bacteriostatic water','Syringes','Wipes','Pens']},
];
export const slugify = (s:string) => s.toLowerCase().replace(/\+/g,'-plus').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const priced: Record<string, {strength:string,price:number}[]> = {
 'Retatrutide':[{strength:'10mg',price:59.99}], 'Tirzepatide':[{strength:'10mg',price:54.99}], 'Semaglutide':[{strength:'5mg',price:19.99}],
 'BPC-157':[{strength:'5mg',price:15.99},{strength:'10mg',price:29.99}], 'TB-500':[{strength:'5mg',price:21.99},{strength:'10mg',price:37.99}],
 'GHK-Cu':[{strength:'50mg',price:19.99},{strength:'100mg',price:37.99}], 'CJC-1295 no-DAC':[{strength:'5mg',price:24.99}], 'Ipamorelin':[{strength:'5mg',price:18.99}], 'GLOW':[{strength:'70mg',price:59.99}],
};
export type Product = {name:string;slug:string;category:string;variants:{strength:string;price:number}[];image:string};
export const products:Product[] = categories.flatMap(c=>c.items.map(name=>({name,slug:slugify(name),category:c.slug,variants:priced[name] ?? [],image:vial})));
export const featured = ['Retatrutide','Tirzepatide','BPC-157','TB-500','GHK-Cu','GLOW'];
export const gbp = (value:number) => '£'+value.toFixed(2);
export type CartItem = {slug:string;name:string;strength:string;quantity:number;price:number};
export const cartKey = 'vyrax-basket';
export function readCart():CartItem[] { try { return JSON.parse(localStorage.getItem(cartKey) || '[]'); } catch { return []; } }
export function addCart(item:CartItem) { const items=readCart(); const existing=items.find(i=>i.slug===item.slug&&i.strength===item.strength); if(existing) existing.quantity+=item.quantity; else items.push(item); localStorage.setItem(cartKey,JSON.stringify(items)); window.dispatchEvent(new Event('vyrax-cart')); }
