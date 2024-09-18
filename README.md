# Generic OpenEBench 2D plot online visualizer

Project that allows to visualize benchmarking results in a *'D3.js'* chart coming from any OEB workflow in the official benchmarking data model format. 

The sample [data](./data) used in this visualizer has been derived from the materials of next manuscript:

[Comprehensive Characterization of Cancer Driver Genes and Mutations](https://www.cell.com/cell/fulltext/S0092-8674%2818%2930237-X?code=cell-site), Bailey et al, 2018, Cell

[![doi:10.1016/j.cell.2018.02.060](https://img.shields.io/badge/doi-10.1016%2Fj.cell.2018.02.060-green.svg)](https://doi.org/10.1016/j.cell.2018.02.060)

# How to use

Requirements:

-npm
-http server

Clone the repo to your document root :
```
git clone https://github.com/inab/benchmarking_workflows_results_visualizer.git
```

Install dependencies from package.json :
```
npm install 
```

Export node moodules :
```
export PATH="${PWD}/node_modules/.bin/:$PATH"
```
Compile with webpack and visualize sample results in your localhost :
```
./node_modules/.bin/webpack-cli src/app.js --output=build/build.js -d -w
```
