const request = require('request');
const  { PERCY_TOKEN, CIRCLE_SHA1 } = process.env;

const getBuilds = ({token, projectId, filterSha}) => new Promise((resolve, reject) => {
    request({
        'method': 'GET',
        'url': 'https://percy.io/api/v1/builds',
        'headers': {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        form: {
            'project_id': projectId,
            'filter[sha]': filterSha
        }
    }, function (error, response) {
        console.log(error)

        console.log(JSON.parse(response.body, null, 2))
        if (error) reject(error);
        resolve(JSON.parse(response.body))
    })
});
// s
(async ()=>{
    const { poll } = await import('poll')
    let completed = false
    let pollCount = 0
    let percyBuild

    await poll(
        async ()=> {
            completed = true
            const { data } = await getBuilds({ token: PERCY_TOKEN, projectId: '435051', filterSha: CIRCLE_SHA1 || '1' })

            if(data[0]) {
                completed = true
                percyBuild = data[0]
            }

            console.log(`Poll ${++pollCount}: ${data[0] ?  'Build found' : 'Build not found'}`)
        },
        5000,
        () => !completed
    )

    console.log(JSON.stringify(percyBuild, null, 2))

    if(percyBuild.attributes['total-comparisons-diff'] > 0 && percyBuild.attributes['total-snapshots-unreviewed'] > 0) {
        throw new Error('Unreviewed diffs')
    }
})()
