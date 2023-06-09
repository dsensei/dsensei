import React, { useState, type FC } from 'react';
import { format } from 'sql-formatter';
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';

interface Props {
  query: string
  onRunEditedQuery: (query: string) => Promise<void>
}

export const Query: FC<Props> = ({ query, onRunEditedQuery }) => {
  if (!query) {
    return <></>;
  }

  const formattedQuery = format(query);

  const [isEditing, setIsEditing] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState('');
  const [editedQuery, setEditedQuery] = useState(formattedQuery);

  const onCanceled = () => {
    setEditedQuery(formattedQuery);
    setIsEditing(false);
    setError('');
    setHasError(false);
  };

  const renderEditingControl = () => {
    if (isRunning) {
      return <span>Running...</span>;
    }

    let errorBlock = null;
    if (hasError) {
      let errorMessage = error;
      const extracted = error.match(/[Error: ]+(.*)/);
      if (extracted != null && extracted.length > 1) {
        errorMessage = extracted[1];
      }
      errorBlock = <div>
        <span className="flex">Error happened when running the query:</span>
        <span className="flex text-red-500">{errorMessage}</span>
        <span className="flex">Please correct and rerun.</span>
      </div>
    }
    if (isEditing) {
      return <>
        {errorBlock}
        <div className="flex justify-center">
          <button className="px-1 text-blue-400 font-bold"
            onClick={async () => {
              if (editedQuery.trim() === formattedQuery) {
                onCanceled(); return;
              }
              setIsRunning(true);
              try {
                await onRunEditedQuery(editedQuery);
                setIsEditing(false);
              } catch (e) {
                setError(`${e}`);
                setHasError(true);
              } finally {
                setIsRunning(false);
              }
            }}
          >
            Run
          </button>
          |
          <button className="px-1 text-stone-400 font-bold"
            onClick={() => { onCanceled(); }}
          >
            Cancel
          </button>
        </div>
      </>;
    } else {
      return <>
        Seeing any issue in the query? Click <button
          className="font-bold text-blue-400"
          onClick={() => { setIsEditing(true); }}
        > here</button > to edit.
      </>;
    }
  }

  return (
    <>
      <CodeMirror
        className='text-xs'
        value={editedQuery}
        onChange={q => { setEditedQuery(q); }}
        basicSetup={{
          lineNumbers: isEditing,
          foldGutter: isEditing
        }}
        readOnly={!isEditing || isRunning}
        editable={isEditing || !isRunning}
        theme={vscodeDark}
        extensions={[sql({
          upperCaseKeywords: true
        })]}
      />
      {renderEditingControl()}
    </>
  )
};
