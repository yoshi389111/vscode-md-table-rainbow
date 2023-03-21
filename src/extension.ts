import * as vscode from 'vscode';

export const activate = (context: vscode.ExtensionContext): void => {
    const config = vscode.workspace.getConfiguration('markdownTableRainbow');
    const updateDelay: number = config['updateDelay'] || 500;
    const colors: string[] = config['colors'] || [
        "rgba(79,236,236,0.1)",
        "rgba(255,255,64,0.1)",
        "rgba(127,255,127,0.1)",
        "rgba(255,127,255,0.1)",
    ];
    const decorationTypes = colors.map(backgroundColor =>
        vscode.window.createTextEditorDecorationType({
            backgroundColor,
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedOpen,
        })
    );
    context.subscriptions.push(...decorationTypes);

    const REGEX_LINE = /^([ \t]*>)*[ \t]*\|[^\r\n]*$/mg;
    const REGEX_COLUMN = /\|[^|\r\n]*(?=\|)/g;
    const updateDecorations = (editor: vscode.TextEditor): void => {
        const options: vscode.DecorationOptions[][] = decorationTypes.map(_ => []);
        Array.from(editor.document.getText().matchAll(REGEX_LINE)).forEach(matchLine => {
            Array.from(matchLine[0].matchAll(REGEX_COLUMN)).forEach((matchColumn, index) => {
                // see https://github.com/microsoft/TypeScript/issues/36788
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

    let activeEditor = vscode.window.activeTextEditor;
    const updateDecorationsIfPossible = (): void => {
        const editor = activeEditor;
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
            timer = setTimeout(updateDecorationsIfPossible, updateDelay);
        } else {
            updateDecorationsIfPossible();
        }
    };

    if (activeEditor) {
        triggerUpdateDecorations();
    }

    vscode.window.onDidChangeActiveTextEditor(editor => {
        activeEditor = editor;
        triggerUpdateDecorations();
    }, null, context.subscriptions);

    vscode.workspace.onDidChangeTextDocument(event => {
        const editor = activeEditor;
        if (editor && event.document === editor.document) {
            triggerUpdateDecorations(true);
        }
    }, null, context.subscriptions);
};

export const deactivate = (): void => { };
