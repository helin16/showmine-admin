/* eslint-disable camelcase */

import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Editor } from '@tinymce/tinymce-react'
import message from './message'
import MathHelper from '../../Helpers/MathHelper';
import AssetService from '../../Services/AssetService';
import AppService from '../../Services/AppService';

const EditorWrapper = styled.div`
  height: 100%;
  img,
  video{
    max-width: 100%;
  }
`

const imagesUploadHandler = (assetType?: string) => (
  // eslint-disable-line
  blobInfo: any, // eslint-disable-line
  // success: (url: string, options: any) => void,
  // failure: (msg: string, options?: any) => void,
  progress: (percentage: number) => void,
) => new Promise((resolve, reject) => {
  const formData = new FormData()
  const xhr = new XMLHttpRequest()
  xhr.withCredentials = false
  xhr.open('POST', AssetService.getUploadAssetUrl());
  const headerMap = AppService.getHeaders().headers || {};
  Object.keys(headerMap).forEach((key) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    xhr.setRequestHeader(key, `${headerMap[key] || ''}`);
  })
  xhr.upload.onprogress = (e) =>  {
    progress(MathHelper.mul(MathHelper.div(e.loaded, e.total), 100));
  }
  xhr.onload = () => {
    if (xhr.status === 403) {
      reject({message: `HTTP Error: ${xhr.status}`, remove: true });
      return;
    }
    if (xhr.status < 200 || xhr.status >= 300) {
      reject({message: `HTTP Error: ${xhr.status}`});
      return
    }
    const json = JSON.parse(xhr.responseText)
    if (!json || typeof json.url != 'string') {
      reject({message: `Invalid JSON: ${xhr.responseText}`});
      return
    }
    resolve(json.url)
  }
  xhr.onerror = () => {
    reject({message: `Image upload failed due to a XHR Transport error. Code: ${xhr.status}`});
  }
  formData.append('file', blobInfo.blob(), blobInfo.filename());
  if (`${assetType || ''}`.trim() !== '') {
    formData.append('type', `${assetType || ''}`.trim());
  }
  xhr.send(formData)
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const customAction = (assetType?: string) => (editor: any) => {
  // eslint-disable-line
  const input: HTMLInputElement = document.createElement('input')
  input.setAttribute('type', 'file')
  input.setAttribute('accept', 'video/*')
  input.onchange = function () {
    let file: File
    if (input && input.files) {
      file = input.files[0] // eslint-disable-line
      const formData = new FormData()
      const xhr = new XMLHttpRequest()
      xhr.withCredentials = false
      xhr.open('POST', AssetService.getUploadAssetUrl());
      const headerMap = AppService.getHeaders().headers || {};
      Object.keys(headerMap).forEach((key) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        xhr.setRequestHeader(key, `${headerMap[key] || ''}`);
      })
      xhr.upload.onprogress = function () {
        editor.setProgressState(true)
      }
      xhr.onload = function () {
        editor.setProgressState(false)
        if (xhr.status === 200) {
          const json = JSON.parse(xhr.responseText)
          if (!json || typeof json.url != 'string') {
            message.error(`Invalid JSON: ${xhr.responseText}`)
            return
          }
          const videoDom = `<video width='100%' height='240px' poster='${json.url.replace(`.${json.externalObj?.format || ''}`, '.jpg')}' controls="controls">
            <source src='${json.url}' type='${json.fileType}'/>
          </video>`
          editor.insertContent(videoDom)
        } else {
          message.error(`Image upload failed due to a XHR Transport error. Code: ${xhr.status}`)
        }
      }
      xhr.onerror = function () {
        editor.setProgressState(false)
        message.error(`Image upload failed due to a XHR Transport error. Code: ${xhr.status}`)
      }
      formData.append('file', file);
      if (`${assetType || ''}`.trim() !== '') {
        formData.append('type', `${assetType || ''}`.trim());
      }
      xhr.send(formData)
    }
  }
  input.click()
}

const defaultEditorConfig = {
  menubar: true,
  branding: false,
  statusbar: false,
  placeholder: '',
  paste_block_drop: false,
  paste_data_images: true,
  paste_as_text: true,
  powerpaste_word_import: 'clean',
  powerpaste_html_import: 'clean',
  image_uploadtab: true,
  image_title: true,
  file_picker_types: 'media image',
  plugins: [
    'advlist', 'autolink', 'lineheight',
    'lists', 'link', 'image', 'charmap', 'print', 'preview', 'anchor',
    'searchreplace', 'visualblocks', 'code', 'fullscreen',
    'insertdatetime', 'media', 'table', 'paste', 'code', 'help', 'wordcount', 'image', 'table'
  ],
  fullscreen_native: true,
  // toolbar_mode: 'sliding',
  image_dimensions: false,
  image_class_list: [{ title: 'responsive', value: 'img-responsive' }],
  toolbar: [
    'undo redo | formatselect | fontsize bold italic forecolor backcolor lineheight | ' +
    'alignleft aligncenter alignright alignjustify | ' +
    'table image customInsertButton code | bullist numlist outdent indent | link removeformat fullscreen',
  ]
}
const initialState = {
  editor: defaultEditorConfig,
  value: '',
  loading: false,
}

type iRichTextEditor = {
  className?: string
  onChange?: (newText: string) => void;
  value: string
  placeholder?: string
  isInLine?: boolean,
  assetType?: string;
}
/**
 *
 * @param onChange
 * @param value
 */
const RichTextEditor = ({ className, onChange, value, placeholder, isInLine = false, assetType, ...props }: iRichTextEditor) => {
  const [state, setState] = useState(initialState)
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
        placeholder: placeholder || '',
      },
    }))
  }, [value, placeholder])

  /**
   *
   * @param newValue
   */
  const handleContentChange = (content: string) => {
    setState({
      ...state,
      value: content,
    })
  }
  /**
   *
   */
  const handleBlur = () => {
    if (typeof onChange === 'function') {
      onChange(state.value)
    }
  }

  return (
    <EditorWrapper className={className}>
      <input id='my-file' type='file' name='my-file' style={{ display: 'none' }} />
      <Editor
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        init={{
          ...state.editor,
          inline: isInLine,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          images_upload_handler: imagesUploadHandler(assetType),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setup: (editor: any) => {
            // eslint-disable-line
            editor.ui.registry.addButton('customInsertButton', {
              icon: 'embed',
              onAction: () => customAction(assetType)(editor),
            })
          },
        }}
        {...props}
        apiKey={process.env.REACT_APP_TINYMCE_API_KEY}
        // initialValue={state.value}
        value={state.value}
        onEditorChange={handleContentChange}
        onBlur={handleBlur}
      />
    </EditorWrapper>
  )
}

export default RichTextEditor
