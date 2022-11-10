const core = require('@actions/core')

const noChangelog = `# Changelog

- skipped`

const changelog = `# Changelog
## Component: Infra
### Added
- added 0
- added 1
### Changed
- changed 0
- changed 1
- changed 3

### Removed
- removed 0
### Fixed
- fixed 0
### Security


   
- Security 0
### Deprecated
- deprecated 0
`

const CHANGELOG_TAG = '# Changelog'
const COMPONENT_TAG = '## Component: '
const ELEMENT_TAG_PREFIX = '- '
const HEADING_TAG_PREFIX = '### '
const HEADING_TAGS = [
    HEADING_TAG_PREFIX + 'Added',
    HEADING_TAG_PREFIX + 'Changed',
    HEADING_TAG_PREFIX + 'Removed',
    HEADING_TAG_PREFIX + 'Fixed',
    HEADING_TAG_PREFIX + 'Security',
    HEADING_TAG_PREFIX + 'Deprecated'
]
const SKIPPED_ELM = 'skipped'

const elementTag = tag => {
    return ELEMENT_TAG_PREFIX + tag
}

const cleanUpInput = input => {
    const inputByLines = input.split('\n')
    const len = inputByLines.length

    for(let i = 0; i < len; i++) {
        if (inputByLines[i].replace(/\s/g, '').length) {
            inputByLines.push(inputByLines[i])
        }
    }
    inputByLines.splice(0 , len)
    return inputByLines
}

function checkRequiredFields(desc) {
    if (desc[0] !== CHANGELOG_TAG) {
        throw new Error('Missing changelog. Please see changelog doc in README.')
    }
    
    if (desc[1] === elementTag(SKIPPED_ELM)) {
        console.log('Changelog skipped.')
        throw new Error(SKIPPED_ELM)
    }
    
    if (!desc[1].startsWith(COMPONENT_TAG)) {
        throw new Error('Missing mandatory heading "' + COMPONENT_TAG + '". Please see changelog doc in README')
    }
    
    let containHeading = false
    for (let i = 2; i < desc.length; i++) {
        for (let j = 0; j < HEADING_TAGS.length; j++) {
            if (desc[i] === HEADING_TAGS[j]) {
                if(i+1 < desc.length && desc[i+1].startsWith(ELEMENT_TAG_PREFIX)) {
                    containHeading = true
                    continue
                }
                throw new Error('Bad changelog format. Expecting heading tag to contain at least one element below')
                return
            }
        }
    }
    if (!containHeading) {
        throw new Error('No heading found. Please specify at lease one heading [' + HEADING_TAGS + '].')
    }
}

const getChangelogIndx = (input, changelogIndx) => {
  let changelogFound = false
  for (let i = changelogIndx.start; i < input.length; i++) {
    const line = input[i].trim()
    console.log(line)
    if (line === CHANGELOG_TAG) {
      changelogIndx.start = i
      changelogFound = true
      continue
    }
    if (changelogFound) {
      if ((!line.startsWith(COMPONENT_TAG)
        && !line.startsWith(HEADING_TAG_PREFIX)
        && !line.startsWith(ELEMENT_TAG_PREFIX))
            || i + 1 === input.length) {
          changelogIndx.end = i
          break
        }
    }
  }

  if (!changelogFound) {
    changelogIndx.end = -1
  }

  return changelogIndx
}

/*DescObj {
    component: {
        added: {},
        changed: {},
        removed: {},
        fixed: {},
        security: {},
        deprecated: {}
    }
}
*/
const parseDescObj = desc => {
  const descObj = new Object()
  descObj.component = desc[1].split(COMPONENT_TAG)[1]
  desc.map((row, index) => {
      if (HEADING_TAGS.includes(row)) {
          const heading = row.split(HEADING_TAG_PREFIX)[1].toLowerCase()
          let headings = []
          let i = index + 1
          while(i < desc.length && desc[i].startsWith(ELEMENT_TAG_PREFIX)) {
              headings.push(desc[i].slice(2))
              i++
          }
          descObj[heading] = headings
          index = i
      }
  })
  return descObj
}

const createDescObj = (input, changelogIndx) => {
  try {
    const endIndx = changelogIndx.end + 1 === input.length ? changelogIndx.end + 1 : changelogIndx.end
    const desc = input.slice(changelogIndx.start, endIndx)
    checkRequiredFields(desc)
    return parseDescObj(desc)
  } catch(error) {
    console.log(error.message)
  }
}

const updateChangelogFile = input => {

}

try {
    let input = core.getInput('input')
    const updateChangelog = core.getInput('update-changelog')

    input = cleanUpInput(input)
    console.log('Received ' + input)
    let changelogIndx = {
      start: 0,
      end: 0
    }
    let descs = []
    const inputLength = input.length;
    console.log('inputLength ' + inputLength)
    
    // while (changelogIndx.start < inputLength || changelogIndx.end === -1) {
      changelogIndx = getChangelogIndx(input, changelogIndx)
      console.log('changelogIndx.start ' + changelogIndx.start + " changelogIndx.end" + changelogIndx.end)
      descObj = createDescObj(input, changelogIndx)
      descs.push(descObj)
      changelogIndx.start = changelogIndx.end + 1
      console.log('changelogIndx.start ' + changelogIndx.start + " changelogIndx.end" + changelogIndx.end)
    // }

    if (updateChangelog) {
      updateChangelogFile(descs)
    }

    console.log(descs)
    core.setOutput('result', 'OK')
} catch (error) {
    console.log(error.message)
    core.setOutput('result', 'not OK')
    core.setFailed(error.message)
}