const path = require("path");
const fs = require("fs");

const { WebCache, VersionResolveError } = require("./WebCache");

/**
 * LocalWebCache - Fetches a WhatsApp Web version from a local file store
 * @param {object} options - options
 * @param {string} options.path - Path to the directory where cached versions are saved, default is: "./.wwebjs_cache/"
 * @param {boolean} options.strict - If true, will throw an error if the requested version can't be fetched. If false, will resolve to the latest version.
 */
class LocalWebCache extends WebCache {
    constructor(options = {}) {
        super();

        this.path = options.path || "./.wwebjs_cache/";
        this.strict = options.strict || false;
    }

    async resolve(version) {
        const filePath = path.join(this.path, `${version}.html`);

        try {
            return fs.readFileSync(filePath, "utf-8");
        } catch (err) {
            if (this.strict)
                throw new VersionResolveError(
                    `Couldn't load version ${version} from the cache`
                );
            return null;
        }
    }

    async persist(indexHtml) {
        // extract version from index (e.g. manifest-2.2206.9.json -> 2.2206.9)
        // extract version from client_revision (e.g. 1012170943 -> 2.3000.1012170943)
        let version = null;
        const matches =
            (await indexHtml.match(/"client_revision"\s*:\s*(\d+)/)) || [];

        if (matches[1]) {
            version = `2.3000.${matches[1]}`;
        } else {
            version = await indexHtml.match(/manifest-([\d\\.]+)\.json/)[1];
        }

        if (!version) return;

        const filePath = path.join(this.path, `${version}.html`);
        fs.mkdirSync(this.path, { recursive: true });
        fs.writeFileSync(filePath, indexHtml);
    }
}

module.exports = LocalWebCache;
