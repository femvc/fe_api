module.exports = {
    service: {
        name: 'campus_api',
        version: '0.0.1',
        ip: '127.0.0.1',
        port: 3000
    },
    session: {
      secret: '1234567890QWERTY'
    },
    mongo: {
      host: '127.0.0.1',
      port: 27017,
      opts: {
        safe: false
      },
      repl_opts: {
        rs_name: 'myrepl',
        read_secondary: true
      },
      host_opts: {
        auto_reconnect: true
      },
      dbname: 'campus_api'
    },
    redis: {
        host: '127.0.0.1',
        port: 6379,
        db: {
            express: 0,
            message_queue: 1,
            message_unsend_num: 2,
            media: 3
        }
    }
};
