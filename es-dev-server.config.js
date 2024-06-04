module.exports = {
    watch: true,
    nodeResolve: true,
    appIndex: 'api.html',
    open: true,
    cors: true,
    plugins: [
        {
            transform(context) {
                context.response.set('Access-Control-Allow-Origin', 'http://127.0.0.1:8000');
                return {
                    body: context.body.replace(/process.env.NODE_ENV/g, JSON.stringify('production'))
                };
            }
        }
    ]
};
