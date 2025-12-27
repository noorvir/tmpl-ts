import marimo

__generated_with = "0.18.4"
app = marimo.App(width="medium")


@app.cell
def _():
    import marimo as mo

    return (mo,)


@app.cell
def _(mo):
    mo.md(
        """
    # Welcome to Marimo

    This is an example notebook. You can run this notebook with:

    ```bash
    uv run marimo edit notebooks/example.py
    ```
    """
    )
    return


@app.cell
def _():
    print("hello")
    return


if __name__ == "__main__":
    app.run()
