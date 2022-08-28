![Tuneup PRIME](img/tuneup-prime.png)

### _No longer maintained_

#### A library management toolkit for Denon Engine PRIME 🎧

- 🚀 [Installation](#-installation)
- ❓ [How To Use](#-how-to-use)
  - 🧠 [`smart playlists`](#-smart-playlists)
  - 🔍 [`relocate tracks`](#-relocate-tracks)
  - 🗃 [`consolidate library`](#-consolidate-library)

## 🌟 Features

- Easy to use graphic interface
- Smart playlists
  - Generate playlists based off of easily configurable rules
  - Filter tracks based on album, file type, and more
  - Use different operators to filter attributes including Regex
  - Logically group filters with `and` & `or`
- Track relocation
  - Relocate missing tracks
  - Provide a folder to search for tracks in
- Library consolidation
  - Move all your tracks into one folder
- Automatically backs up library before running
- Supports Engine 2.1.x
- Cross platform - Windows & macOS

## 🚀 Installation

Simply download the latest version from the [releases page](https://github.com/shayded-exe/tuneup-prime/releases).

## ❓ How To Use

Simply select one of the tools in the middle of the page to get started!

![Home page](img/screens/home.png)

### 🧠 Smart Playlists

Allows you to generate smart playlists based off easily definable sets of rules.

![Smart Playlists](img/screens/smart-playlists.png)

Click "edit" to open the config file in your default text editor.

See the [examples](examples/tuneup.example.yaml) to learn how to define smart playlists.

After editing, click "reload" to see your changes.

Lastly, click "generate" to create your playlists! Each playlist will show a badge indicating how many songs were added to it.

> ⚠️ If a playlist already exists with the same name as one of your smart playlists **IT WILL BE OVERWRITTEN**. In most cases this is desired, as you'll want to update your existing smart playlists.

> tuneup PRIME will automatically create the `tuneup.yaml` config file in your Engine library folder.

### 🔍 Relocate Tracks

Finds tracks in your library that are missing, because you've moved the files to a new folder.

![Relocate Tracks](img/screens/relocate-tracks.png)

First, click "find missing". Tuneup PRIME will scan your library for tracks that can't be found by Engine. Once the scan is complete, you'll see a list of all the missing tracks detected.

Next, click "relocate". You'll be prompted to select the folder to search for your tracks in. It will also search up to 5 sub-folders deep. After searching, you'll see an updated list of your tracks and their detected location.

> Currently, the filenames have to be the same, but soon you'll be able to specify rules for matching filenames as well as rename individual files.

### 🗃 Consolidate Library

Does what it says on the tin.

![Consolidate Library](img/screens/consolidate-library.png)
