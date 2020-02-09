const pluginRE = /^(@cheers-mp\/|cheers-mp-|@[\w-]+\/cheers-mp-)plugin-/;
const scopeRE = /^@[\w-]+\//;
const officialRE = /^@cheers-mp\//;

exports.isPlugin = id => pluginRE.test(id);

exports.isOfficialPlugin = id => exports.isPlugin(id) && officialRE.test(id);

exports.toShortPluginId = id => id.replace(pluginRE, "");

exports.resolvePluginId = id => {
  // already full id
  // e.g. cheers-mp-plugin-foo, @cheers-mp/plugin-foo, @bar/cheers-mp-plugin-foo
  if (pluginRE.test(id)) {
    return id;
  }
  // scoped short
  // e.g. @cheers-mp/foo, @bar/foo
  if (id.charAt(0) === "@") {
    const scopeMatch = id.match(scopeRE);
    if (scopeMatch) {
      const scope = scopeMatch[0];
      const shortId = id.replace(scopeRE, "");
      return `${scope}${scope === "@cheers-mp/" ? `` : `cheers-mp-`}plugin-${shortId}`;
    }
  }
  // default short
  // e.g. foo
  return `cheers-mp-plugin-${id}`;
};

exports.matchesPluginId = (input, full) => {
  const short = full.replace(pluginRE, "");
  return (
    // input is full
    full === input ||
    // input is short without scope
    short === input ||
    // input is short with scope
    short === input.replace(scopeRE, "")
  );
};
