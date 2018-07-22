var newButton, openButton, saveButton, darkButton
var editor
var menu
var fileEntry
var hasWriteAccess

const { remote, clipboard } = require('electron')
const { Menu, MenuItem, dialog } = remote
const fs = require('fs')

function handleDocumentChange(title) {
    if (title) {
        title = title.match(/[^/]+$/)[0]
        var filename = title.replace(/^.*[\\\/]/, '')
        document.getElementById('title').innerHTML = filename
        document.title = title

        if (title.match(/.md$/)) {
            mode = 'md'
            modeName = 'MarkDown'
        } else {
            mode = 'nope'
            modeName = 'nao suportado';
        }
    } else {
        document.getElementById('title').innerHTML = '(sem doc)'
    }

    // editor.setModes('mode', mode)
    if(filename) 
        document.getElementById('heading').innerHTML = filename.replace('.' + mode, '')
        
    document.getElementById('mode').innerHTML = modeName
}

function newFile() {
    fileEntry = null
    hasWriteAccess = false
    handleDocumentChange(null)
}

function setFile(theFileEntry, isWritable) {
    fileEntry = theFileEntry
    hasWriteAccess = isWritable
}

function readFileIntoEditor(theFileEntry) {
    fs.readFile(theFileEntry.toString(), function (err, data) {
        if (err)
            console.log('failed to read: ' + err)

        handleDocumentChange(theFileEntry)
        document.getElementById('words').innerHTML = wordCount(String(data)) + ' words'
        document.getElementById('time').innerHTML = readingTime(String(data)) + ' minutes'
        document.getElementById('editor').innerHTML += String(data)
    })
}

function writeEditorToFile(theFileEntry) {
    var str = editor.getValue()

    fs.writeFile(theFileEntry, editor.getValue(), function (err) {
        if (err) {
            console.log('failed to write: ' + err)
            return
        }

        handleDocumentChange(theFileEntry)
        console.log('write completed')
    })
}

var onChosenFileToOpen = function (theFileEntry) {
    setFile(theFileEntry, false)
    readFileIntoEditor(theFileEntry)
}

var onChosenFileToSave = function (theFileEntry) {
    setFile(theFileEntry, true)
    writeEditorToFile(theFileEntry)
}

function wordCount(str) {
    return str.split(' ')
           .filter(function(n) { return n != '' })
           .length;
}

function readingTime(text) {
    const wordsPerMinute = 200;
    const noOfWords = wordCount(text);
    const minutes = noOfWords / wordsPerMinute;
    const readTime = Math.ceil(minutes);
    return readTime;
  }

function handleNewButton() {
    if (false) {
        newFile()
        editor.setValue('')
    } else {
        window.open('file:///' + __dirname + '/index.html')
    }
}

function handleOpenButton() {
    dialog.showOpenDialog({ properties: ['openFile'] }, function (filename) {
        onChosenFileToOpen(filename.toString());
    });
}

function handleSaveButton() {
    if(fileEntry && hasWriteAccess) {
        writeEditorToFile(fileEntry)
    } else {
        dialog.showSaveDialog(function(filename) {
            onChosenFileToSave(filename.toString(), true)
        })
    }
}

function handleDarkMode() {
    if(this.checked) {
        document.body.classList.add("dark-mode");
    } else {
        document.body.classList.remove("dark-mode");
    }
}

function initContextMenu() {
    menu = new Menu()
    menu.append(new MenuItem({
        label: 'Copy', 
        click: function() {
            clipboard.writeText(editor.getSelection(), 'copy')
        }
    }))
    menu.append(new MenuItem({
        label: 'Cut',
        click: function() {
            clipboard.writeText(editor.getSelection(), 'copy')
            editor.replaceSelection('')
        }
    }))
    menu.append(new MenuItem({
        label: 'Paste',
        click: function() {
            editor.replaceSelection(clipboard.readText('copy'))
        }
    }))

    window.addEventListener('contextmenu', function(e) {
        e.preventDefault()
        menu.popup(remote.getCurrentWindow(), e.x, e.y)
    }, false)
}

onload = function() {
    initContextMenu()

    newButton = document.getElementById('new')
    openButton = document.getElementById('open')
    saveButton = document.getElementById('save')
    darkButton = document.getElementById('dark-mode')

    newButton.addEventListener('click', handleNewButton)
    openButton.addEventListener('click', handleOpenButton)
    saveButton.addEventListener('click', handleSaveButton)
    darkButton.addEventListener('change', handleDarkMode)

    editor = document.getElementById('editor'); 

    newFile()
    onresize()
}

onresize = function() {
    var container = document.getElementById('editor')
    var containerWidth = container.offsetWidth
    var containerHeight = container.offsetHeight

    var scrollerElement = editor.getScrollerElement()
    scrollerElement.style.width = containerWidth + 'px'
    scrollerElement.style.height = containerHeight + 'px'

    editor.refresh()
}