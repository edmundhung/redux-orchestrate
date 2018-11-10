import adapterFactory from './adapterFactory';

function connectFactory(key) {
  return adapterFactory('connect', key);
}

export default connectFactory;
