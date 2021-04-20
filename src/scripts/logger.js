const logger = (msg, props) => {
  console.log(`%c[ReOpen EXT]: ${msg}`, 'background: #ff8000; color: #fff');
  if (props) {
    console.log('[ReOpen EXT]', props);
  }
}