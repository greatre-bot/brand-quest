import propTypes from './pixel-props.json' with {type:'json'};

const VEHICLE_KEYS = new Set(['scooter', 'vespa']);

export function mapSpace(map) {
  const all = map.layers.find(layer => layer.name === 'props').objects.map((obj, idx) => ({
    idx, key: obj.name, x: obj.x + obj.width / 2, y: obj.y + obj.height
  }));
  const props = [];
  const vehicles = [];
  for (const item of all) {
    if (VEHICLE_KEYS.has(item.key)) {
      const n = vehicles.length;
      vehicles.push({
        id: 'veh_' + n,
        key: item.key,
        x: item.x,
        y: item.y,
        label: item.key === 'vespa' ? '骑上红色电动车' : '骑上青色电动车',
        featured: n === 1 // Highlight the curbside scooter closest to Mixue storefront
      });
    } else {
      props.push({key: item.key, x: item.x, y: item.y});
    }
  }
  const solids = props.flatMap(({key,x,y}) => {
    const [dx,dy,w,h] = propTypes[key].footprint;
    return h ? [{x:x+dx,y:y+dy,w,h}] : [];
  });
  return {map,props,vehicles,solids,buildings:[],mapW:map.width*map.tilewidth,mapH:map.height*map.tileheight};
}
