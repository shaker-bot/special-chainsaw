"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "./Toast";

const ProfileSchema = z.object({
    first_name: z.string().optional().or(z.literal("")),
    last_name: z.string().optional().or(z.literal("")),
    avatar_url: z.string().optional().or(z.literal("")),
    bio: z.string().optional().or(z.literal("")),
    birthday: z.string().optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof ProfileSchema>;

export default function ProfileForm() {

    const [loading, setLoading] = useState(true);
    const [saved, setSaved] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [prefs, setPrefs] = useState<Record<string, unknown> | null>(null);
    const { toast } = useToast();
    const [avatarBroken, setAvatarBroken] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { isSubmitting, errors, isDirty },
    } = useForm<ProfileFormValues>({
        resolver: zodResolver(ProfileSchema),
        mode: "onChange",
    });

    const watchAvatar = watch("avatar_url");

    // reset avatar error state when URL changes
    React.useEffect(() => {
        setAvatarBroken(false);
    }, [watchAvatar]);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const res = await fetch("/api/profile");
            if (!res.ok) {
                setLoading(false);
                return;
            }

            const json = await res.json();
            const data = json?.data ?? null;
            if (data) {
                const birthday = data.preferences?.birthday ?? "";
                setPrefs(data.preferences ?? {});
                reset({
                    first_name: data.first_name ?? "",
                    last_name: data.last_name ?? "",
                    avatar_url: data.avatar_url ?? "",
                    bio: data.bio ?? "",
                    birthday,
                });
            }

            setLoading(false);
        }

        load();
    }, [reset]);

    const handleAvatarUpload = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;

            setUploading(true);
            try {
                const body = new FormData();
                body.append("file", file);

                const res = await fetch("/api/profile/avatar", {
                    method: "POST",
                    body,
                });

                const json = await res.json();
                if (!res.ok) {
                    toast("error", json?.error ?? "Upload failed");
                    return;
                }

                // set the returned URL into the form field
                setValue("avatar_url", json.url, { shouldDirty: true });
                toast("success", "Avatar uploaded");
            } catch {
                toast("error", "Upload failed");
            } finally {
                setUploading(false);
                // reset file input so the same file can be re-selected
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        },
        [setValue, toast]
    );

    async function onSubmit(values: ProfileFormValues) {
        setSaved(false);
        setServerError(null);

        try {
            const resp = await fetch("/api/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            const json = await resp.json();
            if (!resp.ok) {
                const err = json?.error ?? "Failed to save";
                setServerError(err);
                toast("error", err);
                return;
            }

            // reconcile local prefs state
            const newPrefs = { ...(prefs ?? {}) };
            if (values.birthday) {
                newPrefs.birthday = values.birthday;
            } else {
                delete newPrefs.birthday;
            }
            setPrefs(newPrefs);

            setSaved(true);
            toast("success", "Profile saved");
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error(err);
            setServerError("Failed to save profile");
            toast("error", "Failed to save profile");
        }
    }

    return (
        <div className="w-full rounded-md border border-white/6 bg-white/3 p-6">
            <h2 className="mb-4 text-lg font-medium text-white">Profile</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                        <input
                            className="rounded border border-white/10 bg-transparent px-3 py-2 text-white placeholder:text-zinc-400 w-full"
                            placeholder="First name"
                            {...register("first_name")}
                        />
                        {errors.first_name && (
                            <div className="mt-1 text-sm text-rose-400">
                                {String(errors.first_name.message)}
                            </div>
                        )}
                    </div>

                    <div>
                        <input
                            className="rounded border border-white/10 bg-transparent px-3 py-2 text-white placeholder:text-zinc-400 w-full"
                            placeholder="Last name"
                            {...register("last_name")}
                        />
                        {errors.last_name && (
                            <div className="mt-1 text-sm text-rose-400">
                                {String(errors.last_name.message)}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-start gap-4">
                    <div className="flex w-24 flex-col items-center gap-2">
                        {watchAvatar && !avatarBroken ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={watchAvatar as string}
                                alt="avatar preview"
                                className="h-20 w-20 rounded-full object-cover"
                                onError={() => setAvatarBroken(true)}
                                onLoad={() => setAvatarBroken(false)}
                            />
                        ) : (
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/6 text-white">
                                <span className="text-sm">A</span>
                            </div>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            onChange={handleAvatarUpload}
                        />
                        <button
                            type="button"
                            disabled={uploading}
                            className="text-xs text-zinc-400 hover:text-white transition disabled:opacity-50"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {uploading ? "Uploading..." : "Upload"}
                        </button>
                    </div>

                    <div className="flex-1">
                        <input
                            className="rounded border border-white/10 bg-transparent px-3 py-2 text-white placeholder:text-zinc-400 w-full"
                            placeholder="Avatar URL"
                            {...register("avatar_url")}
                        />
                        {errors.avatar_url && (
                            <div className="mt-1 text-sm text-rose-400">
                                {String(errors.avatar_url.message)}
                            </div>
                        )}

                        <textarea
                            rows={3}
                            className="mt-3 rounded border border-white/10 bg-transparent px-3 py-2 text-white placeholder:text-zinc-400 w-full"
                            placeholder="Bio"
                            {...register("bio")}
                        />
                        {errors.bio && (
                            <div className="mt-1 text-sm text-rose-400">
                                {String(errors.bio.message)}
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <input
                        type="date"
                        className="w-max rounded border border-white/10 bg-transparent px-3 py-2 text-white placeholder:text-zinc-400"
                        {...register("birthday")}
                    />
                    {errors.birthday && (
                        <div className="mt-1 text-sm text-rose-400">
                            {String(errors.birthday.message)}
                        </div>
                    )}
                </div>

                <div className="mt-3 flex items-center gap-3">
                    <button
                        type="submit"
                        disabled={isSubmitting || !isDirty}
                        className="inline-flex items-center gap-2 rounded bg-white/6 px-3 py-2 text-sm text-white transition hover:brightness-110 disabled:opacity-50"
                    >
                        {isSubmitting ? "Saving..." : "Save"}
                    </button>

                    <span className={`text-sm text-emerald-400 transform transition-all duration-200 ${saved ? "scale-105 opacity-100" : "scale-90 opacity-0"}`} aria-hidden>
                        Saved ✅
                    </span>

                    {serverError && (
                        <span className="text-sm text-rose-400">{serverError}</span>
                    )}

                    {loading && <span className="text-sm text-zinc-400">Loading…</span>}
                </div>
            </form>

        </div>
    );
}
