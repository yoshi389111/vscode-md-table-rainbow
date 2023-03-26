import * as vscode from 'vscode';

export const activate = (context: vscode.ExtensionContext): void => {

    const getConfig = () => vscode.workspace.getConfiguration('markdownTableRainbow');

    const dispose = (disposable: { dispose(): any }) => {
        const index = context.subscriptions.indexOf(disposable);
        if (index !== -1) {
            context.subscriptions.splice(index, 1);
        }
        disposable.dispose();
    };

    const DEFAULT_COLORS = [
        "rgba(79,236,236,0.1)",
        "rgba(255,255,64,0.1)",
        "rgba(127,255,127,0.1)",
        "rgba(255,127,255,0.1)"
    ];
    const REGEX_COLOR = RegExp("^(#[0-9a-fA-F]{6})|(rgb\\(\\s*(25[0-5]|2[0-4]\\d|1\\d{2}|\\d{1,2})\\s*,\\s*(25[0-5]|2[0-4]\\d|1\\d{2}|\\d{1,2})\\s*,\\s*(25[0-5]|2[0-4]\\d|1\\d{2}|\\d{1,2})\\s*\\))|(rgba\\(\\s*(25[0-5]|2[0-4]\\d|1\\d{2}|\\d{1,2})\\s*,\\s*(25[0-5]|2[0-4]\\d|1\\d{2}|\\d{1,2})\\s*,\\s*(25[0-5]|2[0-4]\\d|1\\d{2}|\\d{1,2})\\s*,\\s*[01](\\.\\d+)?\\s*\\))$");
    const getColors = (showError = false): string[] => {
        const colors = getConfig().get<string[]>('colors', []);
        if (colors.length === 0) {
            return DEFAULT_COLORS;
        }
        if (!colors.every(it => it.match(REGEX_COLOR))) {
            if (showError) {
                vscode.window.showErrorMessage(
                    "Invalid value in 'markdownTableRainbow.colors'.\n" +
                    "Specify the color string in \"#RRGGBB\", \"rgb(R,G,B)\" or \"rgba(R,G,B,A)\" format."
                );
            }
            return DEFAULT_COLORS;
        }
        return colors;
    };

    const decorationTypes: vscode.TextEditorDecorationType[] = [];
    const createResources = (showError = false): void => {
        decorationTypes.forEach(it => dispose(it));

        decorationTypes.length = 0;
        getColors(showError).forEach(color => decorationTypes.push(
            vscode.window.createTextEditorDecorationType({
                backgroundColor: color,
                rangeBehavior: vscode.DecorationRangeBehavior.ClosedOpen,
            }))
        );

        context.subscriptions.push(...decorationTypes);
    };
    createResources(true);

    const REGEX_LINE = /^([ \t]*>)*[ \t]*\|[^\r\n]*$/mg;
    const REGEX_COLUMN = /\|[^|\r\n]*(?=\|)/g;
    const updateDecorations = (editor: vscode.TextEditor): void => {
        const options: vscode.DecorationOptions[][] = decorationTypes.map(_ => []);
        Array.from(editor.document.getText().matchAll(REGEX_LINE)).forEach(matchLine => {
            Array.from(matchLine[0].matchAll(REGEX_COLUMN)).forEach((matchColumn, index) => {
                // `match.index` returned by `matchAll()` must exist.
                // ref. https://github.com/microsoft/TypeScript/issues/36788
                const startPos = matchLine.index! + matchColumn.index!;
                const range = new vscode.Range(
                    editor.document.positionAt(startPos),
                    editor.document.positionAt(startPos + matchColumn[0].length)
                );
                options[index % options.length].push({ range });
            });
        });
        decorationTypes.forEach((decorationType, index) =>
            editor.setDecorations(decorationType, options[index])
        );
    };

    const updateDecorationsIfPossible = (): void => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            updateDecorations(editor);
        }
    };

    let timer: NodeJS.Timer | undefined = undefined;
    const triggerUpdateDecorations = (throttle = false): void => {
        if (timer) {
            clearTimeout(timer);
            timer = undefined;
        }
        if (throttle) {
            const updateDelay = getConfig().get<number>('updateDelay', 500);
            timer = setTimeout(updateDecorationsIfPossible, updateDelay);
        } else {
            updateDecorationsIfPossible();
        }
    };
    triggerUpdateDecorations();

    vscode.window.onDidChangeActiveTextEditor(_ => {
        triggerUpdateDecorations();
    }, null, context.subscriptions);

    vscode.workspace.onDidChangeTextDocument(event => {
        if (event.document === vscode.window.activeTextEditor?.document) {
            triggerUpdateDecorations(true);
        }
    }, null, context.subscriptions);

    vscode.workspace.onDidChangeConfiguration(event => {
        createResources(event.affectsConfiguration("markdownTableRainbow.colors"));
        triggerUpdateDecorations();
    }, null, context.subscriptions);
};

export const deactivate = (): void => { };
