const moment = require('moment');

function formatMessage(from, content) {
  return {
    from,
    content,
    time: moment().format('h:mm a')
  };
}



module.exports = formatMessage;