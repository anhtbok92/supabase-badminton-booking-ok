'use client';

import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Highlight } from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code,
  Heading1, Heading2, Heading3, List, ListOrdered, Quote,
  Undo, Redo, Link as LinkIcon, Image as ImageIcon,
  Type, Highlighter, Table as TableIcon, Trash2,
  ChevronDown, Maximize2, Minimize2, Code2
} from 'lucide-react';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder = 'Bắt đầu viết nội dung...' }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Placeholder.configure({ placeholder }),
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-primary underline cursor-pointer' } }),
      Image.configure({ HTMLAttributes: { class: 'max-w-full h-auto rounded-lg shadow-sm my-4' } }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base dark:prose-invert focus:outline-none min-h-[300px] w-full max-w-none p-4 pb-20',
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return null;

  const addImage = () => {
    const url = window.prompt('Nhập URL hình ảnh:');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Nhập URL:', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const MenuBar = () => (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30 sticky top-0 z-10">
      <div className="flex items-center gap-0.5 border-r pr-1 mr-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn("h-8 w-8 p-0", editor.isActive('bold') && "bg-muted text-primary")}
          title="In đậm"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn("h-8 w-8 p-0", editor.isActive('italic') && "bg-muted text-primary")}
          title="In nghiêng"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={cn("h-8 w-8 p-0", editor.isActive('underline') && "bg-muted text-primary")}
          title="Gạch chân"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={cn("h-8 w-8 p-0", editor.isActive('strike') && "bg-muted text-primary")}
          title="Gạch ngang"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-0.5 border-r pr-1 mr-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn("h-8 w-8 p-0", editor.isActive('heading', { level: 1 }) && "bg-muted text-primary")}
          title="Tiêu đề 1"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn("h-8 w-8 p-0", editor.isActive('heading', { level: 2 }) && "bg-muted text-primary")}
          title="Tiêu đề 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={cn("h-8 w-8 p-0", editor.isActive('heading', { level: 3 }) && "bg-muted text-primary")}
          title="Tiêu đề 3"
        >
          <Heading3 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-0.5 border-r pr-1 mr-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn("h-8 w-8 p-0", editor.isActive('bulletList') && "bg-muted text-primary")}
          title="Danh sách dấu chấm"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn("h-8 w-8 p-0", editor.isActive('orderedList') && "bg-muted text-primary")}
          title="Danh sách số"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn("h-8 w-8 p-0", editor.isActive('blockquote') && "bg-muted text-primary")}
          title="Trích dẫn"
        >
          <Quote className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-0.5 border-r pr-1 mr-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={cn("h-8 w-8 p-0", editor.isActive('code') && "bg-muted text-primary")}
          title="Mã"
        >
          <Code className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={cn("h-8 w-8 p-0", editor.isActive('codeBlock') && "bg-muted text-primary")}
          title="Khối mã"
        >
          <Code2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-0.5 border-r pr-1 mr-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={setLink}
          className={cn("h-8 w-8 p-0", editor.isActive('link') && "bg-muted text-primary")}
          title="Liên kết"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addImage}
          className="h-8 w-8 p-0"
          title="Hình ảnh"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          className="h-8 w-8 p-0"
          title="Bảng"
        >
          <TableIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-0.5 border-r pr-1 mr-1">
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" title="Màu chữ">
              <Type className="h-4 w-4" style={{ color: editor.getAttributes('textStyle').color }} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2">
            <div className="grid grid-cols-5 gap-1">
              {['#000000', '#737373', '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef'].map(color => (
                <button
                  key={color}
                  type="button"
                  className="w-6 h-6 rounded-full border border-muted"
                  style={{ backgroundColor: color }}
                  onClick={() => editor.chain().focus().setColor(color).run()}
                />
              ))}
              <Button type="button" variant="outline" size="sm" className="col-span-5 mt-2 h-7 text-[10px]" onClick={() => editor.chain().focus().unsetColor().run()}>
                Xóa màu
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" title="Highlight">
              <Highlighter className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2">
            <div className="grid grid-cols-5 gap-1">
              {['#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8', '#ddd6fe'].map(color => (
                <button
                  key={color}
                  type="button"
                  className="w-6 h-6 rounded-sm border border-muted"
                  style={{ backgroundColor: color }}
                  onClick={() => editor.chain().focus().setHighlight({ color }).run()}
                />
              ))}
              <Button type="button" variant="outline" size="sm" className="col-span-5 mt-2 h-7 text-[10px]" onClick={() => editor.chain().focus().unsetHighlight().run()}>
                Xóa highlight
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center gap-0.5 ml-auto">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="h-8 w-8 p-0"
          title="Hoàn tác"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="h-8 w-8 p-0"
          title="Làm lại"
        >
          <Redo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsFullScreen(!isFullScreen)}
          className="h-8 w-8 p-0 ml-2"
          title={isFullScreen ? "Thu lại" : "Toàn màn hình"}
        >
          {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );

  return (
    <div className={cn(
      "relative border rounded-md overflow-hidden bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-all",
      isFullScreen && "fixed inset-0 z-[100] h-screen w-screen rounded-none"
    )}>
      <MenuBar />

      <div className={cn(
        "overflow-y-auto w-full",
        isFullScreen ? "h-[calc(100vh-48px)] bg-background" : "max-h-[600px]"
      )}>
        <EditorContent editor={editor} />
      </div>

      {editor.isActive('table') && (
        <div className="absolute bottom-2 left-2 flex gap-1 p-1 bg-background border rounded-md shadow-lg z-10 animate-in fade-in slide-in-from-bottom-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().addColumnBefore().run()} className="h-7 px-2 text-[10px]">Thêm cột trái</Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().addColumnAfter().run()} className="h-7 px-2 text-[10px]">Thêm cột phải</Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().deleteColumn().run()} className="h-7 px-2 text-destructive text-[10px]">Xóa cột</Button>
          <div className="w-[1px] bg-muted mx-1" />
          <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().addRowBefore().run()} className="h-7 px-2 text-[10px]">Thêm hàng trên</Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().addRowAfter().run()} className="h-7 px-2 text-[10px]">Thêm hàng dưới</Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().deleteRow().run()} className="h-7 px-2 text-destructive text-[10px]">Xóa hàng</Button>
          <div className="w-[1px] bg-muted mx-1" />
          <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().deleteTable().run()} className="h-7 px-2 text-destructive text-[10px]"><Trash2 className="h-3 w-3 mr-1" /> Xóa bảng</Button>
        </div>
      )}

      {/* BubbleMenu is omitted for compatibility unless specifically requested and functional in this env */}

      <style jsx global>{`
        .prose ul { list-style-type: disc !important; padding-left: 1.5em !important; margin: 1em 0 !important; }
        .prose ol { list-style-type: decimal !important; padding-left: 1.5em !important; margin: 1em 0 !important; }
        .prose table { border-collapse: collapse; table-layout: fixed; width: 100%; margin: 0; overflow: hidden; }
        .prose table td, .prose table th { border: 2px solid #ced4da; box-sizing: border-box; min-width: 1em; padding: 3px 5px; position: relative; vertical-align: top; }
        .prose table th { background-color: #f8f9fa; font-weight: bold; text-align: left; }
        .prose table .selectedCell:after { background: rgba(200, 200, 255, 0.4); content: ""; left: 0; right: 0; top: 0; bottom: 0; pointer-events: none; position: absolute; z-index: 2; }
        .prose table .column-resize-handle { background-color: #adf; bottom: -2px; position: absolute; right: -2px; top: 0; width: 4px; z-index: 20; }
        .prose h1 { font-size: 2em !important; font-weight: bold !important; margin-bottom: 0.5em !important; }
        .prose h2 { font-size: 1.5em !important; font-weight: bold !important; margin-bottom: 0.5em !important; }
        .prose h3 { font-size: 1.25em !important; font-weight: bold !important; margin-bottom: 0.5em !important; }
        .prose blockquote { border-left: 3px solid #ced4da !important; padding-left: 1em !important; color: #6c757d !important; font-style: italic !important; }
        .prose code { background-color: #f8f9fa !important; color: #e83e8c !important; padding: 0.2em 0.4em !important; border-radius: 3px !important; font-family: monospace !important; }
        .prose pre { background: #212529 !important; color: #f8f9fa !important; padding: 0.75rem 1rem !important; border-radius: 0.5rem !important; margin: 1rem 0 !important; overflow-x: auto !important; }
        .prose pre code { color: inherit !important; padding: 0 !important; background: none !important; font-size: 0.8rem !important; }
        .prose img { max-width: 100% !important; height: auto !important; border-radius: 8px !important; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1) !important; }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
