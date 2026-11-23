# Recipe CSV export

Run from this folder with Node.js:

```powershell
node export-recipes.js
```

This writes `recipes.csv`, with one row per recipe and one multiline `wikitext`
cell containing the complete wiki table row. Import it as a comma-delimited UTF-8
CSV with double quotes as the text qualifier. Embedded line breaks stay inside
the `wikitext` cell. Copy the cell's text into an existing MediaWiki table.
The wiki entry uses actual newlines without the backslashes used in the example.

The exporter reads `recipes.response.json` and `skills.response.json`, then
enriches recipes from `recipe-details.json` or the latest dated
`arelith-recipe-details-*.json` in the same folder. `inputs.response.json` is a
catalog of names; ingredient membership comes from each recipe.

All source recipe fields become columns. `inputs` and `outputs` preserve the
base name lists, while `input` and `output` preserve detail objects as JSON,
including item IDs, skill/category IDs, and quantities. `materials` and `products`
are readable lists separated by `<br>`. Requirements stay in their own columns.
Where base and harvested values differ, harvested details take precedence and
the original value is retained in a `base_` column (such as `base_name`).
The wiki row follows the nine-column layout in the example.

Properties remain blank in the CSV and the `<!--Properti-->|` wiki line.
No weight or property values are generated. The wiki image
defaults to `N/A`; `recipeImageUrl` separately preserves the harvested URL
(these signed URLs expire). Source names are preserved, including `Amber`
and `Tough Shell` for Featherweight Coffret.

To supply a wiki image name, create a JSON file keyed by
recipe ID and regenerate the CSV:

```json
{
  "2314": { "image": "Featherweight Coffret.png" }
}
```

```powershell
node export-recipes.js --overrides wiki-overrides.json
```

Image override values are plain text. To use a wiki image, supply a filename and add any
desired file markup when pasting into the wiki.

Other options:

```powershell
node export-recipes.js --details new-details.json --output updated-recipes.csv
node export-recipes.js --data-dir C:\path\to\data
node export-recipes.js --details none
```

Without harvested details, quantities are marked `?`, and `detailStatus`
identifies the affected rows. Editing the CSV does not recalculate `wikitext`;
update the source data or overrides and rerun the command.
