<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Site presentation
- Keep the existing static landing markup and mount interactive additions through stable placeholder portals to preserve legacy interactions.
- Define brand colors in global semantic CSS tokens, including legacy palette aliases, so recoloring does not alter media or behavior.
- Serve uploaded brand and partnership media through asset pointers; derive the favicon locally from the uploaded mark.
