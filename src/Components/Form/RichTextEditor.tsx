import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Editor } from '@tinymce/tinymce-react';
// import { AnyRecord, AnySoaRecord } from 'dns';
import AuthService from '../../Services/AuthService';
import message from './message';

const EditorWrapper = styled.div`
  height: 100%;
`;

const images_upload_handler = ( // eslint-disable-line
  blobInfo: any, // eslint-disable-line
  success: Function,
  failure: Function,
  progress: Function,
) => {
  const formData = new FormData();
  const xhr = new XMLHttpRequest();
  xhr.withCredentials = false;
  xhr.open('POST', `${process.env.REACT_APP_REST_END_POINT}/asset`);
  xhr.setRequestHeader('Authorization', `X-Auth-Token ${AuthService.getLocalAuthToken()}`);
  xhr.upload.onprogress = function (e) {
    progress(e.loaded / e.total * 100);
  };
  xhr.onload = function () {
    if (xhr.status === 403) {
      failure(`HTTP Error: ${xhr.status}`, { remove: true });
      return;
    }
    if (xhr.status < 200 || xhr.status >= 300) {
      failure(`HTTP Error: ${xhr.status}`);
      return;
    }
    const json = JSON.parse(xhr.responseText);
    if (!json || typeof json.url != 'string') {
      failure(`Invalid JSON: ${xhr.responseText}`);
      return;
    }
    success(json.url, { alt: 'My alt text', width: '100%', height: 'auto' });
  };
  xhr.onerror = function () {
    failure(`Image upload failed due to a XHR Transport error. Code: ${xhr.status}`);
  };
  formData.append('file', blobInfo.blob(), blobInfo.filename());
  xhr.send(formData);
};

const custom_action = (editor: any) => { // eslint-disable-line
  const input: HTMLInputElement = document.createElement('input');
  input.setAttribute('type', 'file');
  input.setAttribute('accept', 'video/*');
  input.onchange = function () {
    let file: File;
    if (input && input.files) {
      file = input.files[0]; // eslint-disable-line
      const formData = new FormData();
      const xhr = new XMLHttpRequest();
      xhr.withCredentials = false;
      xhr.open('POST', `${process.env.REACT_APP_REST_END_POINT}/asset`);
      xhr.setRequestHeader('Authorization', `X-Auth-Token ${AuthService.getLocalAuthToken()}`);
      xhr.upload.onprogress = function () {
        editor.setProgressState(true);
      };
      xhr.onload = function () {
        editor.setProgressState(false);
        if (xhr.status === 200) {
          const json = JSON.parse(xhr.responseText);
          if (!json || typeof json.url != 'string') {
            message.error(`Invalid JSON: ${xhr.responseText}`);
            return;
          }
          const videoDom = `<video width='100%' height='240px' poster='${json.video_thumbnail_asset.url}' controls="controls">
            <source src='${json.url}' type='${json.mime_type}'/>
          </video>`;
          editor.insertContent(videoDom);
        } else {
          message.error(`Image upload failed due to a XHR Transport error. Code: ${xhr.status}`);
        }
      };
      xhr.onerror = function () {
        editor.setProgressState(false);
        message.error(`Image upload failed due to a XHR Transport error. Code: ${xhr.status}`);
      };
      formData.append('file', file);
      xhr.send(formData);
    }
  };
  input.click();
};

const defaultEditorConfig = {
  menubar: false,
  branding: false,
  statusbar: false,
  placeholder: '',
  powerpaste_word_import: 'clean',
  powerpaste_html_import: 'clean',
  inline: false,
  images_upload_handler,
  file_picker_types: 'media image',
  plugins: [
    'advlist autolink lists link charmap print preview anchor',
    'searchreplace visualblocks code fullscreen',
    'insertdatetime table paste help wordcount image',
  ],
  fullscreen_native: true,
  toolbar_mode: 'sliding',
  image_dimensions: false,
  image_class_list: [
    { title: 'Responsive', value: 'img-responsive' },
  ],
  toolbar: [
    'undo redo | formatselect | bold italic forecolor backcolor | '
    + 'alignleft aligncenter alignright alignjustify | '
    + 'bullist numlist outdent indent | link fullscreen | ',
    'image customInsertButton code',
  ],
  setup: (editor: any) => { // eslint-disable-line
    editor.ui.registry.addButton('customInsertButton', {
      icon: 'embed',
      onAction: () => {
        custom_action(editor);
      },
    });
  },
};
const initialState = {
  editor: defaultEditorConfig,
  value: '',
  loading: false,
};

type iRichTextEditor = {
  className?: string, onChange?: Function, value: string, placeholder?: string, isInLine?: boolean
}
/**
 *
 * @param onChange
 * @param value
 */
const RichTextEditor = ({
  className, onChange, value, placeholder, isInLine, ...props
}: iRichTextEditor) => {
  const [state, setState] = useState(initialState);
  /**
   *
   */
  useEffect(() => {
    setState((s) => ({
      ...s,
      value,
      editor: {
        ...s.editor,
        plugins: s.editor.plugins.concat(['autoresize']),
        placeholder: (placeholder || ''),
      },
    }));
  }, [value, placeholder]);

  /**
   *
   * @param newValue
   */
  const handleContentChange = (content: string) => {
    setState({
      ...state,
      value: content,
    });
  };
  /**
   *
   */
  const handleBlur = () => {
    if (typeof (onChange) === 'function') {
      onChange(state.value);
    }
  };
  /**
   *
   */
  return (
    <EditorWrapper className={className}>
      <input id="my-file" type="file" name="my-file" style={{ display: 'none' }} />
      {/*// @ts-ignore*/}
      <Editor init={{
          ...state.editor,
          inline: (isInLine !== undefined),
        }}
        {...props}
        apiKey={process.env.REACT_APP_TINYMCE_API_KEY}
        // initialValue={state.value}
        value={state.value}
        onEditorChange={handleContentChange}
        onBlur={handleBlur}
      />
    </EditorWrapper>
  );
};

export default RichTextEditor;
